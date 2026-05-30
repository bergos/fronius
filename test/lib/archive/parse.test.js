import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'mocha'
import parse from '../../../lib/archive/parse.js'

function archiveResponse (data) {
  return { Body: { Data: data } }
}

const START = '2020-01-01T00:00:00+00:00'

describe('archive/parse', () => {
  it('should ignore devices with unrecognised types', () => {
    const result = parse(archiveResponse({
      unknown_device: {
        DeviceType: 999,
        Start: START,
        Data: { PowerReal_PAC_Sum: { Unit: 'W', Values: { 0: 100 } } }
      }
    }))

    deepStrictEqual(result, [])
  })

  it('should link a battery device to its inverter', () => {
    const result = parse(archiveResponse({
      'inverter/1': {
        DeviceType: 99,
        Start: START,
        Data: {
          PowerReal_PAC_Sum: { Unit: 'W', Values: { 0: 852 } },
          EnergyReal_WAC_Sum_Produced: { Unit: 'Wh', Values: { 0: 70.8 } },
          Current_DC_String_1: { Unit: 'A', Values: { 0: 0 } },
          Voltage_DC_String_1: { Unit: 'V', Values: { 0: 0 } }
        }
      },
      'storage:1': {
        DeviceType: 99,
        Start: START,
        Data: {
          StateOfCharge_Relative: { Unit: '%', Values: { 0: 50 } },
          Current_DC: { Unit: 'A', Values: { 0: -5 } },
          Voltage_DC: { Unit: 'V', Values: { 0: 100 } }
        }
      }
    }))

    const battery = result.find(o => o.observedBy === 'battery/1')
    strictEqual(battery !== undefined, true)
    deepStrictEqual(battery.stateOfCharge, 0.5)
    deepStrictEqual(battery.powerIncoming, 500)
    deepStrictEqual(battery.powerOutgoing, 0)
  })
})
