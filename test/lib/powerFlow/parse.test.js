import { deepStrictEqual } from 'node:assert'
import { describe, it } from 'mocha'
import parse from '../../../lib/powerFlow/parse.js'

function response (data) {
  return {
    Head: { Timestamp: '2020-01-01T00:00:00+00:00' },
    Body: { Data: data }
  }
}

describe('powerFlow/parse', () => {
  describe('battery', () => {
    it('should set powerOutgoing when P_Akku is positive (discharging)', () => {
      const result = parse(response({
        Inverters: { 1: { Battery_Mode: 'normal', P: 0, SOC: 50 } },
        Site: { P_Akku: 1000, P_Grid: 0, P_PV: 0 }
      }))

      const battery = result.find(o => o.observedBy === 'battery/1')
      deepStrictEqual(battery.powerIncoming, 0)
      deepStrictEqual(battery.powerOutgoing, 1000)
    })
  })

  describe('grid meter', () => {
    it('should set powerOutgoing when P_Grid is negative (exporting)', () => {
      const result = parse(response({
        Site: { P_Grid: -500, P_PV: 0 }
      }))

      const meter = result.find(o => o.observedBy === 'meter/grid')
      deepStrictEqual(meter.powerIncoming, 0)
      deepStrictEqual(meter.powerOutgoing, 500)
    })
  })

  describe('inverter', () => {
    it('should set powerOutgoing when P is positive (producing)', () => {
      const result = parse(response({
        Inverters: { 1: { P: 5000 } },
        Site: { P_Grid: 0, P_PV: 0 }
      }))

      const inverter = result.find(o => o.observedBy === 'inverter/1')
      deepStrictEqual(inverter.powerIncoming, 0)
      deepStrictEqual(inverter.powerOutgoing, 5000)
    })
  })

  describe('secondary meter', () => {
    it('should set powerOutgoing when P is positive (producing)', () => {
      const result = parse(response({
        SecondaryMeters: { house: { P: 800 } },
        Site: { P_Grid: 0, P_PV: 0 }
      }))

      const meter = result.find(o => o.observedBy === 'meter/house')
      deepStrictEqual(meter.powerIncoming, 0)
      deepStrictEqual(meter.powerOutgoing, 800)
    })
  })
})
