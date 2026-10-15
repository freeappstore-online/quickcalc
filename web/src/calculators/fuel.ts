// Fuel trip cost in metric (km, L/100km, price per litre) or imperial (miles,
// mpg, price per gallon) units, with US or UK gallons. The conversion factors
// are exact by definition, and switching units remembers the values it
// converted from, so switching back gives the original numbers, not drifted ones.

import { type Decimal, dec, div, isZero, mul } from '../lib/decimal'
import { inputText, parseInput } from '../lib/format'

export type FuelUnits = 'metric' | 'us' | 'uk'

/** Kilometres in one unit of distance: the international mile is exactly 1.609344 km. */
const KM_PER: Record<FuelUnits, Decimal> = { metric: dec('1'), us: dec('1.609344'), uk: dec('1.609344') }
/** Litres in one unit of volume: US gallon 3.785411784 L, UK (imperial) gallon 4.54609 L, both exact. */
const LITRES_PER: Record<FuelUnits, Decimal> = { metric: dec('1'), us: dec('3.785411784'), uk: dec('4.54609') }

/** Places kept in intermediate divisions; far below anything shown. */
const PRECISION = 18
const HUNDRED = dec('100')

export function convertDistance(d: Decimal, from: FuelUnits, to: FuelUnits): Decimal {
  return div(mul(d, KM_PER[from]), KM_PER[to], PRECISION)
}

/** Price per litre <-> price per gallon. */
export function convertPrice(p: Decimal, from: FuelUnits, to: FuelUnits): Decimal {
  return div(mul(p, LITRES_PER[to]), LITRES_PER[from], PRECISION)
}

/**
 * L/100km <-> mpg (US or UK). The two are reciprocal, so 0 has no
 * equivalent across systems and gives null.
 */
export function convertConsumption(c: Decimal, from: FuelUnits, to: FuelUnits): Decimal | null {
  if (from === to) return c
  if (isZero(c)) return null
  // Litres per 100 km, then on to the target.
  const l100 = from === 'metric' ? c : div(mul(HUNDRED, LITRES_PER[from]), mul(c, KM_PER[from]), PRECISION)
  if (to === 'metric') return l100
  return div(mul(HUNDRED, LITRES_PER[to]), mul(l100, KM_PER[to]), PRECISION)
}

export interface TripInput {
  units: FuelUnits
  /** km for metric, miles otherwise. */
  distance: Decimal
  /** L/100km for metric, miles per gallon otherwise. */
  consumption: Decimal
  /** Per litre for metric, per gallon otherwise. */
  price: Decimal
  roundTrip: boolean
}

export interface TripResult {
  /** Litres for metric, gallons otherwise. */
  fuel: Decimal
  /** Unrounded; format it with the currency's minor unit. */
  cost: Decimal
  /** Total distance driven (doubled for a round trip). */
  distance: Decimal
}

export type TripError = 'negative' | 'zero-mpg'

export function tripCost(input: TripInput): TripResult | { error: TripError } {
  const { units, consumption, price } = input
  if ([input.distance, consumption, price].some((d) => d.units < 0n)) return { error: 'negative' }
  const distance = input.roundTrip ? mul(input.distance, dec('2')) : input.distance
  let fuel: Decimal
  if (units === 'metric') {
    fuel = div(mul(distance, consumption), HUNDRED, PRECISION)
  } else {
    if (isZero(consumption)) return { error: 'zero-mpg' }
    fuel = div(distance, consumption, PRECISION)
  }
  return { fuel, cost: mul(fuel, price), distance }
}

// Unit switching on what the person typed. -------------------------------

export interface FuelFields {
  distance: string
  consumption: string
  price: string
}

export interface FuelEntry extends FuelFields {
  units: FuelUnits
  /**
   * What the current values were converted from, plus the text that
   * conversion produced. While the fields still hold that text, the next
   * switch converts from the origin instead, so values never drift.
   */
  origin: (FuelFields & { units: FuelUnits; produced: FuelFields }) | null
}

/** Places shown after converting: distance, consumption, price. */
const SHOWN = { distance: 2, consumption: 2, price: 3 }

function sameFields(a: FuelFields, b: FuelFields): boolean {
  return a.distance === b.distance && a.consumption === b.consumption && a.price === b.price
}

export function switchUnits(entry: FuelEntry, to: FuelUnits, locale: string): FuelEntry {
  const base =
    entry.origin && sameFields(entry, entry.origin.produced)
      ? entry.origin
      : { units: entry.units, distance: entry.distance, consumption: entry.consumption, price: entry.price }
  if (base.units === to) {
    return { units: to, distance: base.distance, consumption: base.consumption, price: base.price, origin: null }
  }

  // Empty or unreadable fields are left as they are.
  const convert = (text: string, places: number, fn: (d: Decimal) => Decimal | null) => {
    const d = parseInput(text, locale)
    const r = d && fn(d)
    return r ? inputText(r, locale, places) : text
  }
  const produced: FuelFields = {
    distance: convert(base.distance, SHOWN.distance, (d) => convertDistance(d, base.units, to)),
    consumption: convert(base.consumption, SHOWN.consumption, (d) => convertConsumption(d, base.units, to)),
    price: convert(base.price, SHOWN.price, (d) => convertPrice(d, base.units, to)),
  }
  return { units: to, ...produced, origin: { ...base, produced } }
}
