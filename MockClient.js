const { readFile } = require('fs')
const { promisify } = require('util')
const glob = require('glob')
const toRdf = require('./lib/toRdf')
const filterArchive = require('./lib/archive/filter')
const parseArchive = require('./lib/archive/parse')
const parsePowerFlow = require('./lib/powerFlow/parse')

class MockClient {
  constructor ({ archive, powerFlow, baseIRI, interval = 10000, mapping = new Map() } = {}) {
    this.archivePattern = archive
    this.powerFlowPattern = powerFlow
    this.interval = interval
    this.mapping = mapping
    this.baseIRI = baseIRI

    this.start = Date.now()

    this.archiveFilenames = null
    this.powerFlowFilenames = null
  }

  async init () {
    if (this.archivePattern && this.archiveFilenames === null) {
      this.archiveFilenames = await promisify(glob)(this.archivePattern)
    }

    if (this.powerFlowPattern && this.powerFlowFilenames === null) {
      this.powerFlowFilenames = await promisify(glob)(this.powerFlowPattern)
    }
  }

  async archive ({ start, end, format = 'json' } = {}) {
    await this.init()

    const filename = this.archiveFilenames[0]
    const content = await promisify(readFile)(filename)
    const raw = JSON.parse(content.toString())

    if (format === 'raw') {
      return raw
    }

    const data = parseArchive(raw, { mapping: this.mapping })
    const filtered = filterArchive(data, { start, end })

    if (format === 'rdf') {
      return toRdf(filtered, { baseIRI: this.baseIRI })
    }

    return filtered
  }

  async powerFlow ({ format = 'json' } = {}) {
    await this.init()

    const now = new Date()
    const filename = this.powerFlowFilenames[Math.floor((now - this.start) / this.interval)]
    const content = await promisify(readFile)(filename)
    const raw = JSON.parse(content.toString())

    raw.Head.Timestamp = now.toISOString()

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

module.exports = MockClient
