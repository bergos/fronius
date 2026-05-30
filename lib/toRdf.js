import { createRequire } from 'node:module'
import JsonLdParser from '@rdfjs/parser-jsonld'
import { getStreamAsArray } from 'get-stream'
import { Readable } from 'readable-stream'

const require = createRequire(import.meta.url)
const context = require('./context.json')

async function toRdf (observations, { baseIRI } = {}) {
  return getStreamAsArray(toRdf.stream(observations, { baseIRI }))
}

toRdf.stream = function (observations, { baseIRI } = {}) {
  const input = new Readable({
    objectMode: true,
    read: () => {
      input.push(JSON.stringify(observations))
      input.push(null)
    }
  })

  const parser = new JsonLdParser({ context })

  return parser.import(input, { baseIRI })
}

export default toRdf
