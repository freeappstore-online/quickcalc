import { describe, expect, it } from 'vitest'
import { add, dec, fromUnits, mul, toString } from '../lib/decimal'
import { splitTip, type TipInput, type TipResult } from './tip'

function run(bill: string, tip: string, people: number, rounding: TipInput['rounding'] = 'none', places = 2) {
  const r = splitTip({ bill: dec(bill), tipPercent: dec(tip), people, rounding, places })
  if ('error' in r) throw new Error(r.error)
  return {
    tip: toString(r.tip, places),
    total: toString(r.total, places),
    share: toString(r.share, places),
    extraPeople: r.extraPeople,
    raw: r,
  }
}

// Shares plus the leftover cents must come back to exactly the total.
function sumOfShares(r: TipResult, people: number, places: number) {
  return add(mul(r.share, dec(people)), fromUnits(BigInt(r.extraPeople), places))
}

describe('splitTip', () => {
  it('splits a bill with the remainder shown, not lost', () => {
    const r = run('100', '15', 3)
    expect(r).toMatchObject({ tip: '15.00', total: '115.00', share: '38.33', extraPeople: 1 })
    expect(toString(sumOfShares(r.raw, 3, 2), 2)).toBe('115.00')
  })

  it('refuses 0 people instead of dividing by zero', () => {
    expect(splitTip({ bill: dec('50'), tipPercent: dec('15'), people: 0, rounding: 'none', places: 2 })).toEqual({
      error: 'no-people',
    })
    expect(splitTip({ bill: dec('50'), tipPercent: dec('15'), people: 1.5, rounding: 'none', places: 2 })).toEqual({
      error: 'no-people',
    })
  })

  it('gives 1 person the whole total', () => {
    expect(run('48.20', '18', 1)).toMatchObject({ tip: '8.68', total: '56.88', share: '56.88', extraPeople: 0 })
  })

  it('handles a 0% tip', () => {
    expect(run('42.50', '0', 2)).toMatchObject({ tip: '0.00', total: '42.50', share: '21.25', extraPeople: 0 })
  })

  it('handles a 100% tip', () => {
    expect(run('42.50', '100', 4)).toMatchObject({ tip: '42.50', total: '85.00', share: '21.25', extraPeople: 0 })
  })

  it('handles a zero bill', () => {
    const r = run('0', '20', 3)
    expect(r).toMatchObject({ tip: '0.00', total: '0.00', share: '0.00', extraPeople: 0 })
    expect(r.raw.effectivePercent).toBeNull()
  })

  it('rounds the tip half-up to the cent', () => {
    expect(run('0.10', '15', 1).tip).toBe('0.02') // 0.015
    expect(run('47.30', '15', 1).tip).toBe('7.10') // 7.095
  })

  it('rounds the total up to a whole unit', () => {
    const r = run('47.30', '15', 3, 'total')
    expect(r).toMatchObject({ tip: '7.70', total: '55.00', share: '18.33', extraPeople: 1 })
    expect(toString(r.raw.effectivePercent!)).toBe('16.28')
  })

  it('rounds each share up to a whole unit', () => {
    expect(run('47.30', '15', 3, 'person')).toMatchObject({
      tip: '9.70',
      total: '57.00',
      share: '19.00',
      extraPeople: 0,
    })
    // Already whole: nothing added.
    expect(run('100', '20', 4, 'person')).toMatchObject({ tip: '20.00', total: '120.00', share: '30.00' })
  })

  it('works in zero-decimal currencies', () => {
    expect(run('1000', '15', 3, 'none', 0)).toMatchObject({ tip: '150', total: '1150', share: '383', extraPeople: 1 })
  })

  it('rejects negative bills and tips', () => {
    expect(splitTip({ bill: dec('-1'), tipPercent: dec('15'), people: 1, rounding: 'none', places: 2 })).toEqual({
      error: 'negative-bill',
    })
    expect(splitTip({ bill: dec('1'), tipPercent: dec('-15'), people: 1, rounding: 'none', places: 2 })).toEqual({
      error: 'negative-tip',
    })
  })

  it('always adds up: shares sum to bill + tip', () => {
    for (const rounding of ['none', 'total', 'person'] as const) {
      for (let cents = 1; cents < 5000; cents += 37) {
        for (const people of [1, 2, 3, 7, 12]) {
          for (const pct of ['0', '12.5', '15', '18', '20', '100']) {
            const bill = fromUnits(BigInt(cents), 2)
            const r = splitTip({ bill, tipPercent: dec(pct), people, rounding, places: 2 })
            if ('error' in r) throw new Error(r.error)
            expect(toString(add(bill, r.tip))).toBe(toString(r.total))
            expect(toString(sumOfShares(r, people, 2))).toBe(toString(r.total))
            expect(r.extraPeople).toBeGreaterThanOrEqual(0)
            expect(r.extraPeople).toBeLessThan(people)
          }
        }
      }
    }
  })
})
