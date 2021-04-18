const { deepStrictEqual, strictEqual } = require('assert')
const { withServer } = require('express-as-promise')
const { describe, it } = require('mocha')
const rdf = require('rdf-ext')
const Client = require('../Client')
const { buildResponse, throughJson } = require('./support/utils')

describe('Client', () => {
  describe('archive', () => {
    it('should be a method', () => {
      const client = new Client('http://example.org/')

      strictEqual(typeof client.archive, 'function')
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
        const parsed = require('./support/archive.parsed.json')
        const content = buildResponse({
          content: {
            Data: require('./support/archive.json')
          }
        })

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.archive({ start: new Date(), end: new Date() })

        deepStrictEqual(throughJson(result), parsed)
      })
    })

    it('should parse the content and convert it to RDF if the format is rdf', async () => {
      await withServer(async server => {
        const parsed = require('./support/archive.parsed.js')(rdf)
        const content = buildResponse({
          content: {
            Data: require('./support/archive.json')
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

    it('should handle data during daylight saving changes', async () => {
      await withServer(async server => {
        const parsed = require('./support/archive.ds.parsed.json')
        const content = buildResponse({
          content: {
            Data: require('./support/archive.ds.json')
          }
        })

        server.app.get('/solar_api/v1/GetArchiveData.cgi', (req, res) => {
          res.json(content)
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.archive({ start: new Date(), end: new Date() })

        deepStrictEqual(throughJson(result), parsed)
      })
    })
  })
})
