import { describe, expect, it } from 'vitest'
import { add, dec, fromUnits, toString } from '../lib/decimal'
import { applyDiscount, type TaxMode } from './discount'

function run(price: string, d1: string, d2 = '0', tax = '0', taxMode: TaxMode = 'added', places = 2) {
  const r = applyDiscount({
    price: dec(price),
    discount: dec(d1),
    secondDiscount: dec(d2),
    tax: dec(tax),
    taxMode,
    places,
  })
  if ('error' in r) throw new Error(r.error)
  return {
    final: toString(r.final, places),
    beforeTax: toString(r.beforeTax, places),
    saving: toString(r.saving, places),
    effective: toString(r.effectivePercent),
    tax: toString(r.taxAmount, places),
  }
}

describe('applyDiscount', () => {
  it('takes a single discount', () => {
    expect(run('80', '25')).toMatchObject({ final: '60.00', saving: '20.00', effective: '25', tax: '0.00' })
  })

  it('handles a 0% discount', () => {
    expect(run('49.99', '0')).toMatchObject({ final: '49.99', saving: '0.00', effective: '0' })
  })

  it('handles a 100% discount', () => {
    expect(run('49.99', '100', '0', '8')).toMatchObject({ final: '0.00', saving: '49.99', effective: '100', tax: '0.00' })
    expect(run('49.99', '50', '100')).toMatchObject({ final: '0.00', effective: '100' })
  })

  it('stacks discounts: 20% then 10% is 28% off', () => {
    expect(run('100', '20', '10')).toMatchObject({ final: '72.00', saving: '28.00', effective: '28' })
    expect(run('100', '10', '20')).toMatchObject({ final: '72.00', effective: '28' })
    expect(run('100', '50', '50')).toMatchObject({ final: '25.00', effective: '75' })
    expect(run('100', '12.5', '7.5').effective).toBe('19.0625')
  })

  it('adds tax on top of the discounted price', () => {
    expect(run('100', '20', '10', '8.25')).toMatchObject({
      beforeTax: '72.00',
      tax: '5.94',
      final: '77.94',
      saving: '28.00',
    })
  })

  it('splits tax out of a tax-inclusive price', () => {
    // 120 incl. 20% VAT, 25% off -> 90 incl. VAT = 75 + 15.
    expect(run('120', '25', '0', '20', 'included')).toMatchObject({
      final: '90.00',
      beforeTax: '75.00',
      tax: '15.00',
      saving: '30.00',
    })
    // The same numbers give different answers inclusive and on top.
    expect(run('100', '0', '0', '10', 'included')).toMatchObject({ final: '100.00', beforeTax: '90.91', tax: '9.09' })
    expect(run('100', '0', '0', '10', 'added')).toMatchObject({ final: '110.00', beforeTax: '100.00', tax: '10.00' })
  })

  it('rounds half-up to the currency minor unit', () => {
    expect(run('19.99', '15')).toMatchObject({ final: '16.99', saving: '3.00' }) // 16.9915
    expect(run('0.05', '50')).toMatchObject({ final: '0.03', saving: '0.02' }) // 0.025
    expect(run('10.00', '0', '0', '7.25')).toMatchObject({ tax: '0.73', final: '10.73' }) // 0.725
    expect(run('1999', '15', '0', '10', 'added', 0)).toMatchObject({ beforeTax: '1699', tax: '170', final: '1869' })
  })

  it('always adds up: before tax + tax = final, discounted + saving = price', () => {
    for (const taxMode of ['added', 'included'] as const) {
      for (let cents = 0; cents < 20000; cents += 173) {
        for (const [d1, d2] of [['0', '0'], ['15', '0'], ['20', '10'], ['33.3', '12.5'], ['100', '0']]) {
          for (const tax of ['0', '5', '8.875', '20']) {
            const price = fromUnits(BigInt(cents), 2)
            const r = applyDiscount({ price, discount: dec(d1), secondDiscount: dec(d2), tax: dec(tax), taxMode, places: 2 })
            if ('error' in r) throw new Error(r.error)
            expect(toString(add(r.beforeTax, r.taxAmount))).toBe(toString(r.final))
            const discounted = taxMode === 'added' ? r.beforeTax : r.final
            expect(toString(add(discounted, r.saving))).toBe(toString(price))
            expect(r.taxAmount.units >= 0n && r.saving.units >= 0n).toBe(true)
          }
        }
      }
    }
  })

  it('rejects out-of-range input', () => {
    const base = { price: dec('10'), discount: dec('10'), secondDiscount: dec('0'), tax: dec('0'), taxMode: 'added' as const, places: 2 }
    expect(applyDiscount({ ...base, price: dec('-1') })).toEqual({ error: 'negative-price' })
    expect(applyDiscount({ ...base, discount: dec('100.01') })).toEqual({ error: 'discount-range' })
    expect(applyDiscount({ ...base, secondDiscount: dec('-5') })).toEqual({ error: 'discount-range' })
    expect(applyDiscount({ ...base, tax: dec('-1') })).toEqual({ error: 'negative-tax' })
  })
})
