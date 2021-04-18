/* This file was automatically generated. Do not edit by hand. */

module.exports = factory => {
  return [
    factory.quad(
      factory.namedNode('battery/1/current'),
      factory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      factory.namedNode('https://cube.link/Observation')
    ),
    factory.quad(
      factory.namedNode('battery/1/current'),
      factory.namedNode('https://cube.link/observedBy'),
      factory.namedNode('battery/1')
    ),
    factory.quad(
      factory.namedNode('battery/1/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerIncoming'),
      factory.literal('6.23E3', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('battery/1/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerOutgoing'),
      factory.literal('0.0E0', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('battery/1/current'),
      factory.namedNode('http://ns.bergnet.org/energy/stateOfCharge'),
      factory.literal('6.4E-1', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('inverter/1/current'),
      factory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      factory.namedNode('https://cube.link/Observation')
    ),
    factory.quad(
      factory.namedNode('inverter/1/current'),
      factory.namedNode('https://cube.link/observedBy'),
      factory.namedNode('inverter/1')
    ),
    factory.quad(
      factory.namedNode('inverter/1/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerIncoming'),
      factory.literal('6.37E2', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('inverter/1/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerOutgoing'),
      factory.literal('0.0E0', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('meter/2/current'),
      factory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      factory.namedNode('https://cube.link/Observation')
    ),
    factory.quad(
      factory.namedNode('meter/2/current'),
      factory.namedNode('https://cube.link/observedBy'),
      factory.namedNode('meter/2')
    ),
    factory.quad(
      factory.namedNode('meter/2/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerIncoming'),
      factory.literal('2.213E3', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('meter/2/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerOutgoing'),
      factory.literal('0.0E0', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('meter/grid/current'),
      factory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      factory.namedNode('https://cube.link/Observation')
    ),
    factory.quad(
      factory.namedNode('meter/grid/current'),
      factory.namedNode('https://cube.link/observedBy'),
      factory.namedNode('meter/grid')
    ),
    factory.quad(
      factory.namedNode('meter/grid/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerIncoming'),
      factory.literal('3.09E2', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('meter/grid/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerOutgoing'),
      factory.literal('0.0E0', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('solar/1/current'),
      factory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      factory.namedNode('https://cube.link/Observation')
    ),
    factory.quad(
      factory.namedNode('solar/1/current'),
      factory.namedNode('https://cube.link/observedBy'),
      factory.namedNode('solar/1')
    ),
    factory.quad(
      factory.namedNode('solar/1/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerIncoming'),
      factory.literal('0.0E0', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    factory.quad(
      factory.namedNode('solar/1/current'),
      factory.namedNode('http://ns.bergnet.org/energy/powerOutgoing'),
      factory.literal('5.835E3', factory.namedNode('http://www.w3.org/2001/XMLSchema#double'))
    )
  ]
}
