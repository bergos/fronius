const { deepStrictEqual, strictEqual } = require('assert')
const { withServer } = require('express-as-promise')
const { describe, it } = require('mocha')
const Client = require('../Client')
const { buildResponse } = require('./support/utils')

describe('Client', () => {
  it('should be a constructor', () => {
    strictEqual(typeof Client, 'function')
  })

  describe('constructor', () => {
    it('assign the given baseURL to the client', () => {
      const baseURL = 'http://example.org/'
      const client = new Client(baseURL)

      strictEqual(client.baseURL, baseURL)
    })
  })

  describe('fetch', () => {
    it('should be a method', () => {
      const client = new Client('http://example.org/')

      strictEqual(typeof client.fetch, 'function')
    })

    it('should make a GET request to baseURL + path', async () => {
      await withServer(async server => {
        let called = false

        server.app.get('/path', (req, res) => {
          called = true

          res.json(buildResponse())
        })

        const url = await server.listen()

        const client = new Client(url)
        await client.fetch('path')

        strictEqual(called, true)
      })
    })

    it('should send the given query params', async () => {
      await withServer(async server => {
        let query = null

        server.app.get('/path', (req, res) => {
          query = req.query

          res.json(buildResponse())
        })

        const url = await server.listen()

        const client = new Client(url)
        await client.fetch('path', { property: 'value' })

        deepStrictEqual(query, {
          property: 'value'
        })
      })
    })

    it('should handle array query param values', async () => {
      await withServer(async server => {
        let query = null

        server.app.get('/path', (req, res) => {
          query = req.query

          res.json(buildResponse())
        })

        const url = await server.listen()

        const client = new Client(url)
        await client.fetch('path', { property: ['value1', 'value2'] })

        deepStrictEqual(query, {
          property: ['value1', 'value2']
        })
      })
    })

    it('should parse the json content', async () => {
      await withServer(async server => {
        const content = { property: 'value' }

        server.app.get('/path', (req, res) => {
          res.json(buildResponse({ content }))
        })

        const url = await server.listen()

        const client = new Client(url)
        const result = await client.fetch('path')

        deepStrictEqual(result, buildResponse({ content }))
      })
    })

    it('should throw an error on not ok status', async () => {
      await withServer(async server => {
        const url = await server.listen()

        const client = new Client(url)

        let error = null

        try {
          await client.fetch('path')
        } catch (err) {
          error = err
        }

        strictEqual(error instanceof Error, true)
      })
    })

    it('should throw an error head status code != 0', async () => {
      await withServer(async server => {
        server.app.get('/path', (req, res) => {
          res.json(buildResponse({ error: 'test error' }))
        })

        const url = await server.listen()

        const client = new Client(url)

        let error = null

        try {
          await client.fetch('path')
        } catch (err) {
          error = err
        }

        strictEqual(error instanceof Error, true)
      })
    })
  })
})
