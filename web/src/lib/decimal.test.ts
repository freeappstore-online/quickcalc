import { describe, expect, it } from 'vitest'
import { add, cmp, dec, div, mul, neg, parse, round, sub, toNumber, toString } from './decimal'

const s = (d: ReturnType<typeof dec>, minPlaces?: number) => toString(d, minPlaces)

describe('decimal', () => {
  it('adds 0.1 + 0.2 exactly', () => {
    expect(s(add(dec('0.1'), dec('0.2')))).toBe('0.3')
    expect(s(add(dec(0.1), dec(0.2)))).toBe('0.3')
    expect(cmp(add(dec('0.1'), dec('0.2')), dec('0.3'))).toBe(0)
  })

  it('has no float drift on everyday sums and products', () => {
    expect(s(sub(dec('1.1'), dec('1')))).toBe('0.1')
    expect(s(mul(dec('1.15'), dec('100')))).toBe('115')
    expect(s(mul(dec('19.99'), dec('3')))).toBe('59.97')
    let total = dec(0)
    for (let i = 0; i < 10; i++) total = add(total, dec('0.1'))
    expect(s(total)).toBe('1')
  })

  it('rounds half-up (away from zero)', () => {
    expect(s(round(dec('2.345'), 2))).toBe('2.35')
    expect(s(round(dec('2.344'), 2))).toBe('2.34')
    expect(s(round(dec('1.005'), 2))).toBe('1.01') // 1.005.toFixed(2) is "1.00"
    expect(s(round(dec('0.5'), 0))).toBe('1')
    expect(s(round(dec('2.5'), 0))).toBe('3')
    expect(s(round(dec('9.995'), 2))).toBe('10.00')
    expect(s(round(dec('1.2'), 2), 2)).toBe('1.20')
  })

  it('handles negatives', () => {
    expect(s(round(dec('-2.345'), 2))).toBe('-2.35')
    expect(s(round(dec('-0.5'), 0))).toBe('-1')
    expect(s(round(dec('-0.004'), 2))).toBe('0.00')
    expect(s(add(dec('-0.1'), dec('-0.2')))).toBe('-0.3')
    expect(s(sub(dec('0.1'), dec('0.3')))).toBe('-0.2')
    expect(s(mul(dec('-1.5'), dec('-2')))).toBe('3')
    expect(s(neg(dec('4.2')))).toBe('-4.2')
    expect(s(div(dec('-1'), dec('8'), 2))).toBe('-0.13')
    expect(cmp(dec('-1'), dec('0.5'))).toBe(-1)
  })

  it('keeps large values exact', () => {
    const big = dec('123456789012345678901234.56')
    expect(s(add(big, dec('0.01')))).toBe('123456789012345678901234.57')
    expect(s(mul(dec('99999999999999999'), dec('99999999999999999')))).toBe(
      '9999999999999999800000000000000001',
    )
    expect(s(dec(1e21))).toBe('1000000000000000000000')
    expect(s(dec(1.5e-7))).toBe('0.00000015')
  })

  it('divides with half-up rounding at the requested places', () => {
    expect(s(div(dec('10'), dec('3'), 2))).toBe('3.33')
    expect(s(div(dec('20'), dec('3'), 2))).toBe('6.67')
    expect(s(div(dec('1'), dec('8'), 2))).toBe('0.13')
    expect(s(div(dec('100'), dec('0.4'), 2))).toBe('250')
    expect(s(div(dec('0.75'), dec('100'), 4))).toBe('0.0075')
    expect(() => div(dec('1'), dec('0'))).toThrow(RangeError)
  })

  it('parses decimal strings and rejects junk', () => {
    expect(parse('.5')).toEqual({ units: 5n, scale: 1 })
    expect(parse('-12.')).toEqual({ units: -12n, scale: 0 })
    expect(parse('')).toBeNull()
    expect(parse('-')).toBeNull()
    expect(parse('1.2.3')).toBeNull()
    expect(parse('1e3')).toBeNull()
    expect(parse('abc')).toBeNull()
    expect(toNumber(dec('12.25'))).toBe(12.25)
  })
})
