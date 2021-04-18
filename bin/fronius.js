#!/usr/bin/env node

const { writeFileSync } = require('fs')
const { resolve } = require('path')
const moment = require('moment')
const { quadToNTriples } = require('@rdfjs/to-ntriples')
const Client = require('../Client')
const MockClient = require('../MockClient')
const program = require('commander')

function createClient (baseURL, options, method) {
  if (baseURL.startsWith('file://')) {
    return new MockClient({ [method]: baseURL.slice(7), ...options })
  } else {
    return new Client(baseURL, options)
  }
}

function toDate (string) {
  if (typeof string === 'undefined' || !string) {
    return null
  }

  if (string.startsWith('P')) {
    return moment().subtract(moment.duration(string))
  }

  if (string.match(new RegExp('^[0-9]{8}$'))) {
    return moment(string, 'YYYYMMDD')
  }

  if (string.match(new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}$'))) {
    return moment(string, 'YYYY-MM-DD')
  }

  return new Date(string)
}

function dateToFilename (date = new Date()) {
  return date
    .toISOString()
    .slice(0, 19)
    .split('-').join('')
    .split(':').join('')
    .split('T').join('-')
}

function toMapping (mapping, all) {
  const [from, to] = mapping.split(':')

  all.set(from, to)

  return all
}

function toNTriples (quads) {
  return quads.map(quad => quadToNTriples(quad)).join('\n')
}

program
  .command('archive <baseUrl>')
  .option('-s, --start [date]', 'Start date', toDate)
  .option('-e, --end [date]', 'End date', toDate)
  .option('-m, --mapping [from:to]', 'id mapping', toMapping, new Map())
  .option('-f, --format [format]', 'Output format', 'json')
  .option('-b, --base-iri [iri]', 'Base IRI for RDF output')
  .action(async (baseURL, { start, end, mapping, format, baseIri }) => {
    const client = createClient(baseURL, { mapping, baseIRI: baseIri }, 'archive')
    const data = await client.archive({ start, end, format })

    if (format === 'rdf') {
      process.stdout.write(toNTriples(data))
    } else {
      process.stdout.write(JSON.stringify(data, null, ' '))
    }
  })

program
  .command('archive-dump <baseUrl>')
  .option('-s, --start [date]', 'Start date', toDate)
  .option('-e, --end [date]', 'End date', toDate)
  .option('-p, --prefix [prefix]', 'Filename prefix', '')
  .action(async (baseURL, { start, end, prefix }) => {
    end = end || new Date()
    start = start || moment(end).subtract(14, 'days')

    const client = createClient(baseURL, {}, 'archive')
    const data = await client.archive({ start, end, format: 'raw' })

    const filename = `${prefix}${moment.utc(end).format('YYYYMMDDHHmmssSSS')}Z.json`

    writeFileSync(filename, JSON.stringify(data, null, 2))
  })

program
  .command('power-flow <baseUrl>')
  .option('-m, --mapping [from:to]', 'id mapping', toMapping, new Map())
  .option('-f, --format [format]', 'Output format', 'json')
  .option('-b, --base-iri [iri]', 'Base IRI for RDF output')
  .action(async (baseURL, { mapping, format, baseIri } = {}) => {
    const client = createClient(baseURL, { mapping, baseIRI: baseIri }, 'powerFlow')
    const data = await client.powerFlow({ format })

    if (format === 'rdf') {
      process.stdout.write(toNTriples(data))
    } else {
      process.stdout.write(JSON.stringify(data, null, ' '))
    }
  })

program
  .command('power-flow-dump <baseUrl>')
  .option('-o, --output [folder]', 'Output folder', '.')
  .option('-n, --interval [seconds]', 'Interval in seconds', parseInt, 10)
  .option('--postfix [string]', 'Postfix string for filename', 'default')
  .action(async (baseURL, { output, interval, postfix } = {}) => {
    const client = createClient(baseURL, {}, 'powerFlow')

    setInterval(async () => {
      const data = await client.powerFlow({ format: 'raw' })
      const filename = `${resolve(output)}/${dateToFilename()}-${postfix}.json`

      console.log(filename)

      writeFileSync(filename, JSON.stringify(data, null, 2))
    }, interval * 1000)
  })

program.parse(process.argv)
