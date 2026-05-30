import { deepStrictEqual, strictEqual } from 'node:assert'
import { createRequire } from 'node:module'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import Client from '../Client.js'
import archiveParsedFactory from './support/archive.parsed.js'
import { buildResponse, throughJson } from './support/utils.js'

const require = createRequire(import.meta.url)
const archiveJson = require('./support/archive.json')
const archiveParsedJson = require('./support/archive.parsed.json')
const archiveTzJson = require('./support/archive.tz.json')
const archiveTzParsedJson = require('./support/archive.tz.parsed.json')

describe('Client', () => {
  describe('archive', () => {
    it('should be a method', () => {
      const client = new Client('http://example.org/')

      strictEqual(typeof client.archive, 'function')
    })

    it('should throw if scope is not System and deviceClass is missing', async () => {
      const client = new Client('http://example.org/')
      let error = null

      try {
        await client.archive({ start: new Date(), end: new Date(), scope: 'Device', deviceId: '1' })
      } catch (err) {
        error = err
      }

      strictEqual(error instanceof Error, true)
      strictEqual(error.message, 'scope=Device, but deviceClass or deviceId not given')
    })

    it('should throw if scope is not System and deviceId is missing', async () => {
      const client = new Client('http://example.org/')
      let error = null

      try {
        await client.archive({ start: new Date(), end: new Date(), scope: 'Device', deviceClass: 'Inverter' })
      } catch (err) {
        error = err
      }

      strictEqual(error instanceof Error, true)
    })

    it('should send DeviceClass and DeviceId when scope is not System', async () => {
      await withServer(async server => {
        let query = null

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          query = req.query

          res.json(buildResponse({ content: { Data: {} } }))
        })

        const url = await server.listen()

        const client = new Client(url)
        await client.archive({ start: new Date(), end: new Date(), scope: 'Device', deviceClass: 'Inverter', deviceId: '1' })

        strictEqual(query.Scope, 'Device')
        strictEqual(query.DeviceClass, 'Inverter')
        strictEqual(query.DeviceId, '1')
      })
    })

    it('should send SeriesType when provided', async () => {
      await withServer(async server => {
        let query = null

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          query = req.query

          res.json(buildResponse({ content: { Data: {} } }))
        })

        const url = await server.listen()

        const client = new Client(url)
        await client.archive({ start: new Date(), end: new Date(), seriesType: 'DailyAverage' })

        strictEqual(query.SeriesType, 'DailyAverage')
      })
    })

    it('should make a GET request to baseURL + archive API path', async () => {
      await withServer(async server => {
        let called = false

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          called = true

          res.json(buildResponse({
            content: {
              Data: {}
            }
          }))
        })

        const url = await server.listen()

        const client = new Client(url)
        await client.archive({ start: new Date(), end: new Date() })

        strictEqual(called, true)
      })
    })

    it('should forward the content if format is raw', async () => {
      await withServer(async server => {
        const content = buildResponse({
          content: {
            Data: {
              test: 'abc'
            }
          }
        })

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.archive({ start: new Date(), end: new Date(), format: 'raw' })

        deepStrictEqual(result, content)
      })
    })

    it('should parse the content', async () => {
      await withServer(async server => {
        const content = buildResponse({
          content: {
            Data: archiveJson
          }
        })

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.archive({ start: new Date(), end: new Date() })

        deepStrictEqual(throughJson(result), archiveParsedJson)
      })
    })

    it('should parse the content and convert it to RDF if the format is rdf', async () => {
      await withServer(async server => {
        const parsed = archiveParsedFactory(rdf)
        const content = buildResponse({
          content: {
            Data: archiveJson
          }
        })

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.archive({ start: new Date(), end: new Date(), format: 'rdf' })

        strictEqual(rdf.dataset(result).toCanonical(), rdf.dataset(parsed).toCanonical())
      })
    })

    it('should handle data with timezone offset', async () => {
      await withServer(async server => {
        const content = buildResponse({
          content: {
            Data: archiveTzJson
          }
        })

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.archive({ start: new Date(), end: new Date() })

        deepStrictEqual(throughJson(result), archiveTzParsedJson)
      })
    })
  })
})
