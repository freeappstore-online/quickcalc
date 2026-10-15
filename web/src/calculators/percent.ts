// Percent maths. Results are numbers of percent (12.5 means 12.5%), or plain
// values for "X% of Y". Undefined cases (dividing by zero) return null.

import { type Decimal, div, mul, normalize, sub } from '../lib/decimal'

const HUNDRED: Decimal = { units: 100n, scale: 0 }

/** X% of Y, exact. */
export function percentOf(x: Decimal, y: Decimal): Decimal {
  const p = mul(x, y)
  return normalize({ units: p.units, scale: p.scale + 2 })
}

/** X is what percent of Y; null when Y is 0. */
export function whatPercent(x: Decimal, y: Decimal, places = 10): Decimal | null {
  if (y.units === 0n) return null
  return div(mul(x, HUNDRED), y, places)
}

/**
 * Percent change from A to B, relative to the size of A (so -10 -> -5 is
 * +50%); null when A is 0, where a percent change is undefined.
 */
export function percentChange(a: Decimal, b: Decimal, places = 10): Decimal | null {
  if (a.units === 0n) return null
  const base = a.units < 0n ? { units: -a.units, scale: a.scale } : a
  return div(mul(sub(b, a), HUNDRED), base, places)
}
