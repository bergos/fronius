const configs = require('../configs')
const transpose = require('./transpose')

function urlifyDate (date) {
  if (typeof date !== 'string') {
    date = date.toISOString()
  }

  return date.match(new RegExp('[0-9]', 'g')).join('').slice(0, 13)
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
  const config = configs.inverter[device.link.model]
  const end = new Date(timestamp)
  const start = new Date(timestamp - duration * 1000)
  const raw = data[device.id][end.toISOString()]
  const rawLink = data[device.link.id][end.toISOString()]

  if (!raw || !rawLink) {
    return null
  }

  const powerOutgoing = config.battery.reduce((powerIncoming, string) => {
    const current = rawLink[`Current_DC_String_${string}`]
    const voltage = rawLink[`Voltage_DC_String_${string}`]

    return powerIncoming + current * voltage
  }, 0)

  const energyOutgoing = powerOutgoing * duration / 60 / 60

  return {
    id: `${device.id}/observation/${urlifyDate(end)}`,
    type: 'Observation',
    observedBy: device.id,
    start,
    end,
    powerIncoming: 0,
    powerOutgoing,
    energyIncoming: 0,
    energyOutgoing,
    stateOfCharge: raw.StateOfCharge_Relative * 0.01
  }
}

buildObservation.Inverter = function ({ device, timestamp, duration, data }) {
  const config = configs.inverter[device.model]
  const end = new Date(timestamp)
  const start = new Date(timestamp - duration * 1000)
  const raw = data[device.id][end.toISOString()]

  if (!raw) {
    return null
  }

  const powerIncoming = config.battery.concat(config.solar).reduce((powerIncoming, string) => {
    const current = raw[`Current_DC_String_${string}`]
    const voltage = raw[`Voltage_DC_String_${string}`]

    return powerIncoming + current * voltage
  }, 0)

  return {
    id: `${device.id}/observation/${urlifyDate(end)}`,
    type: 'Observation',
    observedBy: device.id,
    start,
    end,
    powerIncoming,
    powerOutgoing: raw.PowerReal_PAC_Sum,
    energyIncoming: powerIncoming * duration / 60 / 60,
    energyOutgoing: raw.EnergyReal_WAC_Sum_Produced
  }
}

buildObservation.Meter = function ({ device, timestamp, duration, data, lastTimestamp }) {
  const end = new Date(timestamp)
  const start = new Date(timestamp - duration * 1000)
  const raw = data[device.id][end.toISOString()]

  if (!raw) {
    return null
  }

  const output = {
    id: `${device.id}/observation/${urlifyDate(end)}`,
    type: 'Observation',
    observedBy: device.id,
    start,
    end,
    totalEnergyIncoming: raw.EnergyReal_WAC_Plus_Absolute,
    totalEnergyOutgoing: raw.EnergyReal_WAC_Minus_Absolute
  }

  const prev = data[device.id][(new Date(lastTimestamp).toISOString())]

  if (prev) {
    output.energyIncoming = output.totalEnergyIncoming - prev.EnergyReal_WAC_Plus_Absolute
    output.energyOutgoing = output.totalEnergyOutgoing - prev.EnergyReal_WAC_Minus_Absolute
    output.powerIncoming = output.energyIncoming / duration * 60 * 60
    output.powerOutgoing = output.energyOutgoing / duration * 60 * 60
  }

  return output
}

buildObservation.Solar = function ({ device, timestamp, duration, data }) {
  const config = configs.inverter[device.model]
  const end = new Date(timestamp)
  const start = new Date(timestamp - duration * 1000)
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
    id: `${device.id}/observation/${urlifyDate(end)}`,
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
