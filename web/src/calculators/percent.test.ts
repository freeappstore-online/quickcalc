import { describe, expect, it } from 'vitest'
import { dec, type Decimal, round, toString } from '../lib/decimal'
import { percentChange, percentOf, whatPercent } from './percent'

const s = (d: Decimal | null, places = 4) => (d === null ? null : toString(round(d, places)))

describe('percentOf', () => {
  it('is exact', () => {
    expect(s(percentOf(dec('15'), dec('80')))).toBe('12')
    expect(s(percentOf(dec('0.1'), dec('0.2')))).toBe('0.0002')
    expect(s(percentOf(dec('0'), dec('80')))).toBe('0')
    expect(s(percentOf(dec('100'), dec('42.5')))).toBe('42.5')
    expect(s(percentOf(dec('-20'), dec('50')))).toBe('-10')
  })
})

describe('whatPercent', () => {
  it('finds X as a percent of Y', () => {
    expect(s(whatPercent(dec('20'), dec('80')))).toBe('25')
    expect(s(whatPercent(dec('1'), dec('3')))).toBe('33.3333')
    expect(s(whatPercent(dec('0'), dec('5')))).toBe('0')
    expect(s(whatPercent(dec('150'), dec('100')))).toBe('150')
  })

  it('is undefined when Y is 0', () => {
    expect(whatPercent(dec('5'), dec('0'))).toBeNull()
    expect(whatPercent(dec('0'), dec('0'))).toBeNull()
  })
})

describe('percentChange', () => {
  it('finds increases and decreases', () => {
    expect(s(percentChange(dec('50'), dec('150')))).toBe('200')
    expect(s(percentChange(dec('100'), dec('80')))).toBe('-20')
    expect(s(percentChange(dec('80'), dec('80')))).toBe('0')
    expect(s(percentChange(dec('3'), dec('2')))).toBe('-33.3333')
    expect(s(percentChange(dec('100'), dec('0')))).toBe('-100')
  })

  it('measures change from a negative start against its size', () => {
    expect(s(percentChange(dec('-10'), dec('-5')))).toBe('50')
    expect(s(percentChange(dec('-10'), dec('-20')))).toBe('-100')
    expect(s(percentChange(dec('-10'), dec('10')))).toBe('200')
  })

  it('is undefined from 0', () => {
    expect(percentChange(dec('0'), dec('10'))).toBeNull()
    expect(percentChange(dec('0'), dec('0'))).toBeNull()
  })
})
