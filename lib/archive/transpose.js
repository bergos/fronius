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
      add(`meter/${rawId.slice(6)}`, 'Meter', rawId)
    } else if (rawId.startsWith('storage:')) {
      add(`battery/${rawId.slice(8)}`, 'Battery', rawId)
    } else {
      add(rawId, 'Unknown')
    }
  })

  // link storage to inverter
  devices.forEach(device => {
    if (!device.type === 'Storage') {
      return
    }

    const inverter = devices.filter(device => device.type === 'Inverter')[0]

    if (inverter) {
      device.link = inverter
    }
  })

  return devices
}

function getTimestamps ({ raw }) {
  return [...Object.values(raw).reduce((timestamps, { Start, Data }) => {
    const start = (new Date(Start)).valueOf()

    return Object.values(Data).reduce((timestamps, { Values }) => {
      return Object.keys(Values).reduce((timestamps, offset) => {
        return timestamps.add(start + parseInt(offset) * 1000)
      }, timestamps)
    }, timestamps)
  }, new Set())].sort((a, b) => a - b)
}

function transposeData ({ raw, devices, timestamps }) {
  return devices.reduce((result, device) => {
    if (!raw[device.source]) {
      return result
    }

    result[device.id] = timestamps.reduce((result, timestamp) => {
      const index = (timestamp - (new Date(raw[device.source].Start)).valueOf()) / 1000
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
  const timestamps = getTimestamps({ raw })
  const data = transposeData({ raw, devices, timestamps })

  return {
    devices,
    timestamps,
    data
  }
}

module.exports = transpose
