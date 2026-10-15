// Locale-aware number and currency formatting on top of the exact Decimal.
// Values are rounded exactly first, then handed to Intl as strings, so
// formatting never goes through a float (large values keep every digit).

import { type Decimal, normalize, parse, round, toString } from './decimal'

type NumericString = `${number}`

function intlValue(d: Decimal, minPlaces = 0): NumericString {
  return toString(d, minPlaces) as NumericString
}

/** The device's preferred locale, falling back to en-US. */
export function deviceLocale(): string {
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language
  return 'en-US'
}

export interface NumberFormatOptions {
  /** Digits after the point; the value is rounded half-up to this. Default 2. */
  maxPlaces?: number
  /** Pad to at least this many digits. Default 0. */
  minPlaces?: number
}

export function formatNumber(d: Decimal, locale = deviceLocale(), opts: NumberFormatOptions = {}): string {
  const { maxPlaces = 2, minPlaces = 0 } = opts
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minPlaces,
    maximumFractionDigits: maxPlaces,
  }).format(intlValue(round(d, maxPlaces), minPlaces))
}

/**
 * A value to put back into an input field: rounded half-up, trailing zeros
 * dropped, no grouping, and the locale's decimal mark, so parseInput reads it
 * back exactly ("12,5" in de-DE).
 */
export function inputText(d: Decimal, locale = deviceLocale(), maxPlaces = 2): string {
  return toString(normalize(round(d, maxPlaces))).replace('.', separators(locale).decimal)
}

/** Digits after the point for a currency: 2 for USD and EUR, 0 for JPY. */
export function currencyPlaces(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
}

/** A money amount, rounded half-up to the currency's minor unit. */
export function formatCurrency(d: Decimal, currency: string, locale = deviceLocale()): string {
  const places = currencyPlaces(currency)
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    intlValue(round(d, places), places),
  )
}

/** A percentage given as a number of percent: 12.5 -> "12.5%". */
export function formatPercent(d: Decimal, locale = deviceLocale(), maxPlaces = 2): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: maxPlaces }).format(
    intlValue(round({ units: d.units, scale: d.scale + 2 }, maxPlaces + 2)),
  )
}

function separators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  }
}

/**
 * Reads what someone typed, in their locale: "1,234.5" in en-US and
 * "1.234,5" in de-DE are both 1234.5. In comma-decimal locales a lone dot is
 * also taken as the decimal point, since phone keypads often only offer one.
 * Returns null for empty or invalid input.
 */
export function parseInput(text: string, locale = deviceLocale()): Decimal | null {
  const { group, decimal } = separators(locale)
  let s = text.trim().replace(/[\s  ']/g, '').replace(/^−/, '-')
  if (s === '') return null
  if (decimal === ',' && !s.includes(',') && (s.match(/\./g) ?? []).length === 1) return parse(s)
  if (group !== decimal) s = s.split(group).join('')
  if (decimal !== '.') s = s.replace(decimal, '.')
  return parse(s)
}

// Most-used currency per region; anything else falls back to USD. Eurozone
// members share EUR.
const EURO = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ')
const REGION_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY', HK: 'HKD',
  TW: 'TWD', KR: 'KRW', IN: 'INR', SG: 'SGD', MY: 'MYR', ID: 'IDR', TH: 'THB', PH: 'PHP',
  VN: 'VND', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
  RO: 'RON', BG: 'BGN', UA: 'UAH', TR: 'TRY', IL: 'ILS', AE: 'AED', SA: 'SAR', EG: 'EGP',
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP',
  PE: 'PEN', IS: 'ISK', RS: 'RSD', PK: 'PKR', BD: 'BDT',
  ...Object.fromEntries(EURO.map((r) => [r, 'EUR'])),
}

/** The currency a locale most likely uses: en-US -> USD, de-DE -> EUR, ja-JP -> JPY. */
export function currencyForLocale(locale: string): string {
  let region: string | undefined
  try {
    region = new Intl.Locale(locale).maximize().region
  } catch {
    region = undefined
  }
  return (region && REGION_CURRENCY[region]) || 'USD'
}

/** Currencies offered in the picker, with their names in the given locale. */
export function currencyChoices(locale = deviceLocale()): { code: string; name: string }[] {
  const names = new Intl.DisplayNames([locale], { type: 'currency' })
  const codes = [...new Set(Object.values(REGION_CURRENCY))].sort()
  return codes.map((code) => ({ code, name: names.of(code) ?? code }))
}
