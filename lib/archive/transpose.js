const moment = require('moment-timezone')

function getDevices ({ raw, mapping }) {
  const devices = []

  const add = (id, type, source = id, link = null) => {
    devices.push({
      id: mapping.get(id) || id,
      type,
      model: raw[source].DeviceType,
      source,
      link
    })
  }

  Object.keys(raw).forEach(rawId => {
    if (rawId.startsWith('inverter/')) {
      add(rawId, 'Inverter')
      add(`solar/${rawId.slice(9)}`, 'Solar', rawId)
    } else if (rawId.startsWith('meter:')) {
      add(`meter/${rawId.slice(6).match(/[0-9]+$/)}`, 'Meter', rawId)
    } else if (rawId.startsWith('storage:')) {
      add(`battery/${rawId.slice(8)}`, 'Battery', rawId)
    } else {
      add(rawId, 'Unknown')
    }
  })

  // link storage to inverter
  devices.forEach(device => {
    if (device.type !== 'Storage') {
      return
    }

    const inverter = devices.filter(device => device.type === 'Inverter')[0]

    if (inverter) {
      device.link = inverter
    }
  })

  return devices
}

function parseTimestamp ({ Start, offset }) {
  const offsetShifted = moment(Start).add(parseInt(offset), 'seconds')
  const zoneShifted = offsetShifted.clone().add(moment(Start).utcOffset(), 'minutes')
  const tzCorrected = moment.tz(zoneShifted.toISOString().split('Z')[0], 'Europe/Berlin')

  return tzCorrected.valueOf()
}

function getTimestamps ({ raw }) {
  const timestampMap = Object.values(raw).reduce((timestamps, { Start, Data }) => {
    return Object.values(Data).reduce((timestamps, { Values }) => {
      return Object.keys(Values).reduce((timestamps, offset) => {
        return timestamps.set(parseTimestamp({ Start, offset }), offset)
      }, timestamps)
    }, timestamps)
  }, new Map())

  const timestamps = [...timestampMap.keys()].sort((a, b) => a - b)

  return { timestampMap, timestamps }
}

function transposeData ({ raw, devices, timestampMap, timestamps }) {
  return devices.reduce((result, device) => {
    if (!raw[device.source]) {
      return result
    }

    result[device.id] = timestamps.reduce((result, timestamp) => {
      const index = timestampMap.get(timestamp)
      const date = (new Date(timestamp)).toISOString()

      const current = Object.entries(raw[device.source].Data).reduce((result, [key, { Values }]) => {
        if (typeof Values[index] !== 'undefined') {
          result = result || {}
          result[key] = Values[index]
        }

        return result
      }, null)

      if (current) {
        result[date] = current
      }

      return result
    }, {})

    return result
  }, {})
}

function transpose (json, { mapping = new Map() } = {}) {
  const raw = json.Body.Data

  const devices = getDevices({ raw, mapping })
  const { timestamps, timestampMap } = getTimestamps({ raw })
  const data = transposeData({ raw, devices, timestampMap, timestamps })

  return {
    devices,
    timestamps,
    data
  }
}

module.exports = transpose
