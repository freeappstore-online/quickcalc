import { describe, expect, it } from 'vitest'
import { dec, type Decimal, round, toString } from '../lib/decimal'
import {
  convertConsumption,
  convertDistance,
  convertPrice,
  type FuelEntry,
  type FuelUnits,
  switchUnits,
  tripCost,
  type TripInput,
} from './fuel'

const r = (d: Decimal | null, places = 2) => (d === null ? null : toString(round(d, places), places))

function cost(input: Omit<TripInput, 'roundTrip'> & { roundTrip?: boolean }) {
  const t = tripCost({ roundTrip: false, ...input })
  if ('error' in t) throw new Error(t.error)
  return { fuel: r(t.fuel), cost: r(t.cost), distance: toString(t.distance) }
}

describe('consumption: L/100km <-> mpg', () => {
  it('converts to and from US mpg', () => {
    expect(r(convertConsumption(dec('10'), 'metric', 'us'), 4)).toBe('23.5215')
    expect(r(convertConsumption(dec('30'), 'us', 'metric'), 4)).toBe('7.8405')
    // The defining constant: 100 × 3.785411784 / 1.609344.
    expect(r(convertConsumption(dec('1'), 'metric', 'us'), 6)).toBe('235.214583')
  })

  it('converts to and from UK mpg', () => {
    expect(r(convertConsumption(dec('10'), 'metric', 'uk'), 4)).toBe('28.2481')
    expect(r(convertConsumption(dec('30'), 'uk', 'metric'), 4)).toBe('9.4160')
    expect(r(convertConsumption(dec('1'), 'metric', 'uk'), 6)).toBe('282.480936')
  })

  it('converts between US and UK mpg', () => {
    expect(r(convertConsumption(dec('30'), 'us', 'uk'))).toBe('36.03')
    expect(r(convertConsumption(dec('36.0285'), 'uk', 'us'))).toBe('30.00')
  })

  it('has no equivalent for 0 across systems', () => {
    expect(convertConsumption(dec('0'), 'metric', 'us')).toBeNull()
    expect(convertConsumption(dec('0'), 'uk', 'metric')).toBeNull()
    expect(r(convertConsumption(dec('0'), 'metric', 'metric'))).toBe('0.00')
  })
})

describe('distance and price', () => {
  it('converts km and miles', () => {
    expect(r(convertDistance(dec('100'), 'metric', 'us'), 4)).toBe('62.1371')
    expect(toString(convertDistance(dec('100'), 'us', 'metric'))).toBe('160.9344')
    expect(toString(convertDistance(dec('100'), 'us', 'uk'))).toBe('100')
  })

  it('converts price per litre and per gallon', () => {
    expect(r(convertPrice(dec('1.80'), 'metric', 'us'), 4)).toBe('6.8137')
    expect(r(convertPrice(dec('1.80'), 'metric', 'uk'), 4)).toBe('8.1830')
    expect(r(convertPrice(dec('1'), 'uk', 'metric'), 6)).toBe('0.219969')
  })
})

describe('conversions round-trip without drift', () => {
  const units: FuelUnits[] = ['metric', 'us', 'uk']
  it('exact conversions come back to the start', () => {
    for (const v of ['0.1', '4.7', '6.5', '12.345', '55', '99.99']) {
      for (const a of units) {
        for (const b of units) {
          expect(r(convertConsumption(convertConsumption(dec(v), a, b)!, b, a), 9)).toBe(r(dec(v), 9))
          expect(r(convertDistance(convertDistance(dec(v), a, b), b, a), 9)).toBe(r(dec(v), 9))
          expect(r(convertPrice(convertPrice(dec(v), a, b), b, a), 9)).toBe(r(dec(v), 9))
        }
      }
    }
  })

  const start: FuelEntry = { units: 'metric', distance: '123.45', consumption: '6.7', price: '1.899', origin: null }

  it('switching units and back gives the typed values exactly', () => {
    const us = switchUnits(start, 'us', 'en-US')
    expect(us).toMatchObject({ units: 'us', distance: '76.71', consumption: '35.11', price: '7.188' })
    const uk = switchUnits(us, 'uk', 'en-US')
    expect(uk).toMatchObject({ units: 'uk', distance: '76.71', consumption: '42.16', price: '8.633' })
    const back = switchUnits(uk, 'metric', 'en-US')
    expect(back).toEqual({ ...start, origin: null })
    // Many switches in a row still don't drift.
    let e = start
    for (let i = 0; i < 20; i++) e = switchUnits(e, (['us', 'uk', 'metric'] as const)[i % 3], 'en-US')
    expect(switchUnits(e, 'metric', 'en-US')).toEqual({ ...start, origin: null })
  })

  it('converts from new values once they are edited', () => {
    const us = switchUnits(start, 'us', 'en-US')
    const edited = { ...us, distance: '100' }
    expect(switchUnits(edited, 'metric', 'en-US')).toMatchObject({ distance: '160.93', consumption: '6.7', price: '1.899' })
  })

  it('reads and writes the locale decimal mark, and leaves empty fields alone', () => {
    const de: FuelEntry = { units: 'metric', distance: '12,5', consumption: '', price: '1,8', origin: null }
    const us = switchUnits(de, 'us', 'de-DE')
    expect(us).toMatchObject({ distance: '7,77', consumption: '', price: '6,814' })
    expect(switchUnits(us, 'metric', 'de-DE')).toEqual({ ...de, origin: null })
  })
})

describe('tripCost', () => {
  it('costs a metric trip', () => {
    expect(cost({ units: 'metric', distance: dec('250'), consumption: dec('6.5'), price: dec('1.80') })).toEqual({
      fuel: '16.25',
      cost: '29.25',
      distance: '250',
    })
  })

  it('costs an imperial trip', () => {
    expect(cost({ units: 'us', distance: dec('300'), consumption: dec('30'), price: dec('3.50') })).toMatchObject({
      fuel: '10.00',
      cost: '35.00',
    })
  })

  it('doubles a round trip', () => {
    expect(
      cost({ units: 'metric', distance: dec('250'), consumption: dec('6.5'), price: dec('1.80'), roundTrip: true }),
    ).toEqual({ fuel: '32.50', cost: '58.50', distance: '500' })
  })

  it('costs nothing for zero distance', () => {
    expect(cost({ units: 'metric', distance: dec('0'), consumption: dec('6.5'), price: dec('1.80') })).toMatchObject({
      fuel: '0.00',
      cost: '0.00',
    })
    expect(cost({ units: 'uk', distance: dec('0'), consumption: dec('40'), price: dec('6') }).cost).toBe('0.00')
  })

  it('gives the same cost in every unit system', () => {
    const metric = { units: 'metric' as const, distance: dec('480'), consumption: dec('7.2'), price: dec('1.659') }
    const base = cost(metric).cost
    for (const to of ['us', 'uk'] as const) {
      const c = cost({
        units: to,
        distance: convertDistance(metric.distance, 'metric', to),
        consumption: convertConsumption(metric.consumption, 'metric', to)!,
        price: convertPrice(metric.price, 'metric', to),
      })
      expect(c.cost).toBe(base)
    }
  })

  it('rejects 0 mpg and negative values', () => {
    const base = { units: 'us' as const, distance: dec('10'), consumption: dec('0'), price: dec('3'), roundTrip: false }
    expect(tripCost(base)).toEqual({ error: 'zero-mpg' })
    expect(tripCost({ ...base, consumption: dec('30'), distance: dec('-1') })).toEqual({ error: 'negative' })
  })
})
