const configs = require('../configs')
const transpose = require('./transpose')

function urlifyDate (date) {
  if (typeof date !== 'string') {
    date = date.toISOString()
  }

  return date.match(new RegExp('[0-9]', 'g')).join('').slice(0, 13)
}

function timestampToDate (timestamp) {
  return new Date(timestamp)
}

function observationUrl ({ device, end }) {
  return `${device.id}/history/observation/${urlifyDate(end)}`
}

function buildObservation ({ device, timestamp, data, lastTimestamp }) {
  if (!buildObservation[device.type]) {
    return null
  }

  const duration = lastTimestamp ? (timestamp - lastTimestamp) * 0.001 : 300

  return buildObservation[device.type]({
    device,
    timestamp,
    duration,
    data,
    lastTimestamp
  })
}

buildObservation.Battery = function ({ device, timestamp, duration, data }) {
  const end = timestampToDate(timestamp)
  const start = timestampToDate(timestamp - duration * 1000)
  const raw = data[device.id][end.toISOString()]

  // Hybrid_Operating_State entries may show up in the middle without any other data
  if (!raw || typeof raw.StateOfCharge_Relative === 'undefined') {
    return null
  }

  const current = raw.Current_DC
  const voltage = raw.Voltage_DC
  const power = current * voltage

  const powerIncoming = power < 0 ? -power : 0
  const powerOutgoing = power > 0 ? power : 0

  const energyIncoming = powerIncoming * duration / 60 / 60
  const energyOutgoing = powerOutgoing * duration / 60 / 60

  return {
    id: observationUrl({ device, end }),
    type: 'Observation',
    observedBy: device.id,
    start,
    end,
    powerIncoming,
    powerOutgoing,
    energyIncoming,
    energyOutgoing,
    stateOfCharge: raw.StateOfCharge_Relative * 0.01
  }
}

buildObservation.Inverter = function ({ device, timestamp, duration, data }) {
  const end = timestampToDate(timestamp)
  const start = timestampToDate(timestamp - duration * 1000)
  const raw = data[device.id][end.toISOString()]

  if (!raw) {
    return null
  }

  return {
    id: observationUrl({ device, end }),
    type: 'Observation',
    observedBy: device.id,
    start,
    end,
    powerIncoming: (raw.EnergyReal_WAC_Sum_Consumed || 0) * (3600 / duration),
    powerOutgoing: raw.PowerReal_PAC_Sum,
    energyIncoming: raw.EnergyReal_WAC_Sum_Consumed || 0,
    energyOutgoing: raw.EnergyReal_WAC_Sum_Produced
  }
}

buildObservation.Meter = function ({ device, timestamp, duration, data, lastTimestamp }) {
  const end = timestampToDate(timestamp)
  const start = timestampToDate(timestamp - duration * 1000)
  const raw = data[device.id][end.toISOString()]

  if (!raw) {
    return null
  }

  const direction = raw.Meter_Location_Current === 0

  const output = {
    id: observationUrl({ device, end }),
    type: 'Observation',
    observedBy: device.id,
    start,
    end,
    totalEnergyIncoming: direction ? raw.EnergyReal_WAC_Plus_Absolute : raw.EnergyReal_WAC_Minus_Absolute,
    totalEnergyOutgoing: direction ? raw.EnergyReal_WAC_Minus_Absolute : raw.EnergyReal_WAC_Plus_Absolute
  }

  const prev = data[device.id][(timestampToDate(lastTimestamp).toISOString())]

  if (prev) {
    const prevTotalEnergyIncoming = direction ? prev.EnergyReal_WAC_Plus_Absolute : prev.EnergyReal_WAC_Minus_Absolute
    const prevTotalEnergyOutgoing = direction ? prev.EnergyReal_WAC_Minus_Absolute : prev.EnergyReal_WAC_Plus_Absolute

    output.energyIncoming = output.totalEnergyIncoming - prevTotalEnergyIncoming
    output.energyOutgoing = output.totalEnergyOutgoing - prevTotalEnergyOutgoing
    output.powerIncoming = output.energyIncoming / duration * 60 * 60
    output.powerOutgoing = output.energyOutgoing / duration * 60 * 60
  }

  return output
}

buildObservation.Solar = function ({ device, timestamp, duration, data }) {
  const config = configs.inverter[device.model]
  const end = timestampToDate(timestamp)
  const start = timestampToDate(timestamp - duration * 1000)
  const raw = data[device.id][end.toISOString()]

  if (!raw) {
    return null
  }

  const powerOutgoing = config.solar.reduce((powerIncoming, string) => {
    const current = raw[`Current_DC_String_${string}`]
    const voltage = raw[`Voltage_DC_String_${string}`]

    return powerIncoming + current * voltage
  }, 0)

  const energyOutgoing = powerOutgoing * duration / 60 / 60

  return {
    id: observationUrl({ device, end }),
    type: 'Observation',
    observedBy: device.id,
    start,
    end,
    powerIncoming: 0,
    powerOutgoing,
    energyIncoming: 0,
    energyOutgoing
  }
}

function parse (json, { mapping = new Map() } = {}) {
  const { devices, timestamps, data } = transpose(json, { mapping })

  const observations = Object.values(devices).reduce((observations, device) => {
    let lastTimestamp = null

    observations = timestamps.reduce((observations, timestamp) => {
      const observation = buildObservation({ devices, device, timestamp, data, lastTimestamp })

      if (observation) {
        observations.push(observation)

        lastTimestamp = timestamp
      }

      return observations
    }, observations)

    return observations
  }, [])

  return observations
}

module.exports = parse
