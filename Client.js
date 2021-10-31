const { resolve } = require('path').posix
const { URL } = require('url')
const fetch = require('nodeify-fetch')
const parseArchive = require('./lib/archive/parse')
const parsePowerFlow = require('./lib/powerFlow/parse')
const allChannels = require('./lib/channels')
const toRdf = require('./lib/toRdf')

function urlResolve (baseURL, path) {
  const url = new URL(baseURL)

  url.pathname = resolve(url.pathname, path)

  return url.toString()
}

class Client {
  constructor (baseURL, { baseIRI, mapping = new Map() } = {}) {
    this.baseURL = baseURL
    this.baseIRI = baseIRI
    this.mapping = mapping
  }

  async fetch (path, query) {
    let url = urlResolve(this.baseURL, path)

    if (query) {
      url += '?' + Object.keys(query).map(key => {
        const value = query[key]

        if (Array.isArray(value)) {
          return value.map(v => `${key}=${v}`).join('&')
        } else {
          return `${key}=${value}`
        }
      }).join('&')
    }

    const res = await fetch(url.toString())

    if (!res.ok) {
      const err = new Error(res.statusText)

      err.status = res.status

      throw err
    }

    const content = await res.json()

    if (content.Head.Status.Code) {
      const err = new Error(content.Head.Status.Reason)
      err.content = content

      throw err
    }

    return content
  }

  async archive ({ start, end, scope = 'System', deviceClass, deviceId, channels = allChannels, seriesType, format = 'json' }) {
    const query = {
      Scope: scope,
      StartDate: start.toISOString(),
      EndDate: end.toISOString(),
      Channel: channels,
      HumanReadable: 'False'
    }

    if (scope !== 'System') {
      if (!deviceClass || !deviceId) {
        throw new Error(`scope=${scope}, but deviceClass or deviceId not given`)
      }

      query.DeviceClass = deviceClass
      query.DeviceId = deviceId
    }

    if (seriesType) {
      query.SeriesType = seriesType
    }

    const raw = await this.fetch('solar_api/v1/GetArchiveData.cgi', query)

    if (format === 'raw') {
      return raw
    }

    const data = parseArchive(raw, { mapping: this.mapping })

    if (format === 'rdf') {
      return toRdf(data, { baseIRI: this.baseIRI })
    }

    return data
  }

  async powerFlow ({ format = 'json' } = {}) {
    const raw = await this.fetch('solar_api/v1/GetPowerFlowRealtimeData.fcgi')

    if (format === 'raw') {
      return raw
    }

    const data = parsePowerFlow(raw, { mapping: this.mapping })

    if (format === 'rdf') {
      return toRdf(data, { baseIRI: this.baseIRI })
    }

    return data
  }
}

module.exports = Client
