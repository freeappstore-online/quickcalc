import { describe, expect, it } from 'vitest'
import { add, dec, toString } from './decimal'
import { currencyForLocale, currencyPlaces, formatCurrency, formatNumber, formatPercent, parseInput } from './format'

// Intl uses non-breaking and narrow no-break spaces; compare with plain ones.
const plain = (text: string) => text.replace(/[  ]/g, ' ')

describe('formatNumber', () => {
  it('formats in en-US, de-DE and ja-JP', () => {
    const n = dec('1234567.891')
    expect(formatNumber(n, 'en-US')).toBe('1,234,567.89')
    expect(formatNumber(n, 'de-DE')).toBe('1.234.567,89')
    expect(formatNumber(n, 'ja-JP')).toBe('1,234,567.89')
  })

  it('rounds half-up before formatting', () => {
    expect(formatNumber(dec('1.005'), 'en-US')).toBe('1.01')
    expect(formatNumber(dec('-2.345'), 'de-DE')).toBe('-2,35')
    expect(formatNumber(dec('2'), 'en-US', { minPlaces: 2 })).toBe('2.00')
  })

  it('keeps every digit of large values', () => {
    expect(formatNumber(dec('12345678901234567890.12'), 'en-US')).toBe('12,345,678,901,234,567,890.12')
  })
})

describe('formatCurrency', () => {
  it('formats in en-US, de-DE and ja-JP', () => {
    expect(formatCurrency(dec('1234.5'), 'USD', 'en-US')).toBe('$1,234.50')
    expect(plain(formatCurrency(dec('1234.5'), 'EUR', 'de-DE'))).toBe('1.234,50 €')
    expect(formatCurrency(dec('1234.5'), 'JPY', 'ja-JP')).toMatch(/^[￥¥]1,235$/)
  })

  it('rounds half-up to the currency minor unit', () => {
    expect(formatCurrency(dec('0.125'), 'USD', 'en-US')).toBe('$0.13')
    expect(formatCurrency(dec('-0.125'), 'USD', 'en-US')).toBe('-$0.13')
    expect(formatCurrency(add(dec('0.1'), dec('0.2')), 'USD', 'en-US')).toBe('$0.30')
    expect(currencyPlaces('JPY')).toBe(0)
    expect(currencyPlaces('EUR')).toBe(2)
  })
})

describe('formatPercent', () => {
  it('formats a number of percent', () => {
    expect(formatPercent(dec('12.5'), 'en-US')).toBe('12.5%')
    expect(plain(formatPercent(dec('12.5'), 'de-DE'))).toBe('12,5 %')
    expect(formatPercent(dec('-33.333'), 'en-US')).toBe('-33.33%')
  })
})

describe('parseInput', () => {
  const read = (text: string, locale: string) => {
    const d = parseInput(text, locale)
    return d && toString(d)
  }
  it('reads locale input', () => {
    expect(read('1,234.5', 'en-US')).toBe('1234.5')
    expect(read('1.234,5', 'de-DE')).toBe('1234.5')
    expect(read('12,5', 'de-DE')).toBe('12.5')
    expect(read('12.5', 'de-DE')).toBe('12.5')
    expect(read('1 234,5', 'fr-FR')).toBe('1234.5')
    expect(read('−3', 'en-US')).toBe('-3')
    expect(read('', 'en-US')).toBeNull()
    expect(read('12a', 'en-US')).toBeNull()
  })
})

describe('currencyForLocale', () => {
  it('picks the currency from the locale', () => {
    expect(currencyForLocale('en-US')).toBe('USD')
    expect(currencyForLocale('de-DE')).toBe('EUR')
    expect(currencyForLocale('ja-JP')).toBe('JPY')
    expect(currencyForLocale('ja')).toBe('JPY')
    expect(currencyForLocale('en-GB')).toBe('GBP')
    expect(currencyForLocale('xx-invalid-!!')).toBe('USD')
  })
})
