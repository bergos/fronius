import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import { datasetEqual, quadStreamEqual } from 'rdf-test/assert.js'
import toRdf from '../../lib/toRdf.js'

const baseIRI = 'http://example.org/'

const observation = {
  id: 'solar/1/current',
  type: 'Observation',
  observedBy: 'solar/1'
}

function quads (base = '') {
  return [
    rdf.quad(
      rdf.namedNode(`${base}solar/1/current`),
      rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      rdf.namedNode('https://cube.link/Observation')
    ),
    rdf.quad(
      rdf.namedNode(`${base}solar/1/current`),
      rdf.namedNode('https://cube.link/observedBy'),
      rdf.namedNode(`${base}solar/1`)
    )
  ]
}

describe('lib/toRdf', () => {
  it('should convert observations to an array of quads', async () => {
    datasetEqual(await toRdf([observation], { baseIRI }), quads(baseIRI))
  })

  it('should work without options', async () => {
    datasetEqual(await toRdf([observation]), quads())
  })

  it('.stream() should produce the same quads', async () => {
    await quadStreamEqual(toRdf.stream([observation], { baseIRI }), quads(baseIRI))
  })
})
