// Discount maths: one or two stacked discounts, then tax either added on top
// or already included in the price. Amounts are rounded half-up to the
// currency's minor unit once, at the end, so stacking doesn't compound
// rounding errors.

import { type Decimal, add, cmp, div, fromUnits, mul, sub, toUnits } from '../lib/decimal'

export type TaxMode = 'added' | 'included'

export interface DiscountInput {
  price: Decimal
  /** Discounts as numbers of percent, applied one after the other. */
  discount: Decimal
  secondDiscount: Decimal
  tax: Decimal
  taxMode: TaxMode
  /** Digits after the point for the currency: 2 for USD, 0 for JPY. */
  places: number
}

export interface DiscountResult {
  /** What you pay, tax included. */
  final: Decimal
  /** The discounted price without tax. */
  beforeTax: Decimal
  /** Original price minus discounted price, on the same tax basis as the price. */
  saving: Decimal
  /** Combined discount: 20% then 10% is 28%. */
  effectivePercent: Decimal
  /** The tax in `final`. */
  taxAmount: Decimal
}

export type DiscountError = 'negative-price' | 'discount-range' | 'negative-tax'

const ZERO: Decimal = { units: 0n, scale: 0 }
const ONE: Decimal = { units: 1n, scale: 0 }
const HUNDRED: Decimal = { units: 100n, scale: 0 }

/** A number of percent as a fraction: 20 -> 0.2. */
function fraction(percent: Decimal): Decimal {
  return { units: percent.units, scale: percent.scale + 2 }
}

function inRange(p: Decimal): boolean {
  return cmp(p, ZERO) >= 0 && cmp(p, HUNDRED) <= 0
}

/** Rounded half-up to the currency's minor unit. */
function money(d: Decimal, places: number): Decimal {
  return fromUnits(toUnits(d, places), places)
}

export function applyDiscount(input: DiscountInput): DiscountResult | { error: DiscountError } {
  const { price, discount, secondDiscount, tax, taxMode, places } = input
  if (price.units < 0n) return { error: 'negative-price' }
  if (!inRange(discount) || !inRange(secondDiscount)) return { error: 'discount-range' }
  if (tax.units < 0n) return { error: 'negative-tax' }

  // What's left after both discounts, as a fraction of the price: 0.8 × 0.9 = 0.72.
  const left = mul(sub(ONE, fraction(discount)), sub(ONE, fraction(secondDiscount)))
  const effectivePercent = mul(sub(ONE, left), HUNDRED)
  const discounted = money(mul(price, left), places)
  const saving = sub(money(price, places), discounted)
  const taxRate = fraction(tax)

  if (taxMode === 'added') {
    const taxAmount = money(mul(discounted, taxRate), places)
    return { final: add(discounted, taxAmount), beforeTax: discounted, saving, effectivePercent, taxAmount }
  }
  // Tax included: the discounted price already holds the tax; split it out.
  const beforeTax = money(div(discounted, add(ONE, taxRate), places + 6), places)
  return { final: discounted, beforeTax, saving, effectivePercent, taxAmount: sub(discounted, beforeTax) }
}
