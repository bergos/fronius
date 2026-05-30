import { deepStrictEqual, strictEqual } from 'node:assert'
import { createRequire } from 'node:module'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import Client from '../Client.js'
import powerFlowParsedFactory from './support/powerFlow.parsed.js'
import { buildResponse, throughJson } from './support/utils.js'

const require = createRequire(import.meta.url)
const powerFlowJson = require('./support/powerFlow.json')
const powerFlowParsedJson = require('./support/powerFlow.parsed.json')

describe('Client', () => {
  describe('powerFlow', () => {
    it('should be a method', () => {
      const client = new Client('http://example.org/')

      strictEqual(typeof client.powerFlow, 'function')
    })

    it('should make a GET request to baseURL + power flow API path', async () => {
      await withServer(async server => {
        let called = false

        server.app.get('/solar_api/v1/GetPowerFlowRealtimeData.fcgi', (req, res) => {
          called = true

          res.json(buildResponse({
            content: {
              Data: {}
            }
          }))
        })

        const url = await server.listen()

        const client = new Client(url)
        await client.powerFlow()

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

        server.app.get('/solar_api/v1/GetPowerFlowRealtimeData.fcgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.powerFlow({ format: 'raw' })

        deepStrictEqual(result, content)
      })
    })

    it('should parse the content', async () => {
      await withServer(async server => {
        const content = buildResponse({
          content: {
            Data: powerFlowJson
          }
        })

        server.app.get('/solar_api/v1/GetPowerFlowRealtimeData.fcgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.powerFlow()

        deepStrictEqual(powerFlowParsedJson, throughJson(result))
      })
    })

    it('should parse the content and convert it to RDF if the format is rdf', async () => {
      await withServer(async server => {
        const parsed = powerFlowParsedFactory(rdf)
        const content = buildResponse({
          content: {
            Data: powerFlowJson
          }
        })

        server.app.get('/solar_api/v1/GetPowerFlowRealtimeData.fcgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.powerFlow({ format: 'rdf' })

        strictEqual(rdf.dataset(result).toCanonical(), rdf.dataset(parsed).toCanonical())
      })
    })
  })
})
