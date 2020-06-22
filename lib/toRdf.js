const getStream = require('get-stream')
const JsonLdParser = require('@rdfjs/parser-jsonld')
const { Readable } = require('readable-stream')
const context = require('./context.json')

async function toRdf (observations, { baseIRI } = {}) {
  return getStream.array(toRdf.stream(observations, { baseIRI }))
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

module.exports = toRdf
