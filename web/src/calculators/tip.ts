// Tip & split maths, all in whole minor units (cents) so the shares always
// add back up to the total.

import { type Decimal, div, fromUnits, toUnits } from '../lib/decimal'

export type TipRounding = 'none' | 'total' | 'person'

export interface TipInput {
  bill: Decimal
  /** Tip as a number of percent: 15 means 15%. */
  tipPercent: Decimal
  people: number
  rounding: TipRounding
  /** Digits after the point for the currency: 2 for USD, 0 for JPY. */
  places: number
}

export interface TipResult {
  tip: Decimal
  total: Decimal
  /** What everyone pays at least. */
  share: Decimal
  /**
   * Leftover minor units when the total doesn't split evenly: this many people
   * pay one extra minor unit (one cent) on top of `share`.
   */
  extraPeople: number
  /** Tip as a percent of the bill after rounding, to show what it became. */
  effectivePercent: Decimal | null
}

export type TipError = 'no-people' | 'negative-bill' | 'negative-tip'

function ceilDiv(n: bigint, d: bigint): bigint {
  return n % d === 0n ? n / d : n / d + 1n
}

export function splitTip(input: TipInput): TipResult | { error: TipError } {
  const { places, rounding } = input
  if (!Number.isInteger(input.people) || input.people < 1) return { error: 'no-people' }
  if (input.bill.units < 0n) return { error: 'negative-bill' }
  if (input.tipPercent.units < 0n) return { error: 'negative-tip' }

  const people = BigInt(input.people)
  const unit = 10n ** BigInt(places) // one whole currency unit, in minor units
  const bill = toUnits(input.bill, places)
  // tip = bill × percent / 100, rounded half-up to the minor unit.
  let tip = toUnits({ units: bill * input.tipPercent.units, scale: input.tipPercent.scale + 2 }, 0)
  let total = bill + tip

  // Rounding goes up to a whole currency unit, so the tip is never cut.
  if (rounding === 'total') total = ceilDiv(total, unit) * unit
  if (rounding === 'person') total = ceilDiv(total, people * unit) * unit * people
  tip = total - bill

  const share = total / people
  const extraPeople = Number(total - share * people)
  return {
    tip: fromUnits(tip, places),
    total: fromUnits(total, places),
    share: fromUnits(share, places),
    extraPeople,
    effectivePercent: bill === 0n ? null : div({ units: tip * 100n, scale: 0 }, { units: bill, scale: 0 }, 2),
  }
}
