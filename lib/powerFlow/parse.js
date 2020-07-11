const { get, flatten } = require('lodash')

function map (mapping, id) {
  return mapping.get(id) || id
}

function buildBatteryObservation ({ mapping, date, data }) {
  if (typeof get(data, 'Inverters.1.Battery_Mode') === 'undefined') {
    return []
  }

  const observer = map(mapping, 'battery/1')

  const output = {
    id: `${observer}/current`,
    type: 'Observation',
    observedBy: observer,
    end: date,
    powerIncoming: 0,
    powerOutgoing: 0
  }

  if (data.Site.P_Akku < 0) {
    output.powerIncoming = -data.Site.P_Akku
  } else {
    output.powerOutgoing = data.Site.P_Akku
  }

  if (typeof get(data, 'Inverters.1.SOC') !== 'undefined') {
    output.stateOfCharge = get(data, 'Inverters.1.SOC') * 0.01
  }

  return [output]
}

function buildGridMeterObservation ({ mapping, date, data }) {
  if (!data.Site || !data.Site.P_Grid) {
    return []
  }

  const observer = map(mapping, 'meter/grid')

  const output = {
    id: `${observer}/current`,
    type: 'Observation',
    observedBy: observer,
    end: date,
    powerIncoming: 0,
    powerOutgoing: 0
  }

  if (data.Site.P_Grid > 0) {
    output.powerIncoming = data.Site.P_Grid
  } else {
    output.powerOutgoing = -data.Site.P_Grid
  }

  return [output]
}

function buildInverterObservation ({ mapping, date, data }) {
  if (!data.Site) {
    return []
  }

  const observer = map(mapping, 'inverter/1')

  const output = {
    id: `${observer}/current`,
    type: 'Observation',
    observedBy: observer,
    end: date,
    powerIncoming: 0,
    powerOutgoing: 0
  }

  if (get(data, 'Inverters.1.P') < 0) {
    output.powerIncoming = Math.max(0, 0 - get(data, 'Inverters.1.P'))
  } else {
    output.powerOutgoing = Math.max(0, get(data, 'Inverters.1.P'))
  }

  return output
}

function buildMeterObservations ({ mapping, date, data }) {
  if (!data.SecondaryMeters) {
    return []
  }

  return Object.entries(data.SecondaryMeters).map(([id, meter]) => {
    return buildMeterObservation({ mapping, date, id, meter })
  })
}

function buildMeterObservation ({ mapping, date, id, meter }) {
  const observer = map(mapping, `meter/${id}`)

  const output = {
    id: `${observer}/current`,
    type: 'Observation',
    observedBy: observer,
    end: date,
    powerIncoming: 0,
    powerOutgoing: 0
  }

  if (meter.P > 0) {
    output.powerOutgoing = meter.P
  } else {
    output.powerIncoming = -meter.P
  }

  return output
}

function buildSolarObservation ({ mapping, date, data }) {
  if (!data.Site) {
    return []
  }

  const observer = map(mapping, 'solar/1')

  const output = {
    id: `${observer}/current`,
    type: 'Observation',
    observedBy: observer,
    end: date,
    powerIncoming: 0,
    powerOutgoing: 0
  }

  output.powerOutgoing = data.Site.P_PV || 0

  return [output]
}

function parse (json, { mapping = new Map() } = {}) {
  const date = new Date(json.Head.Timestamp)
  const data = json.Body.Data

  return flatten([
    buildBatteryObservation({ mapping, date, data }),
    buildGridMeterObservation({ mapping, date, data }),
    buildInverterObservation({ mapping, date, data }),
    buildMeterObservations({ mapping, date, data }),
    buildSolarObservation({ mapping, date, data })
  ])
}

module.exports = parse
