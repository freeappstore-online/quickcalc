import { Choice, NumberField, Result } from '../components/ToolFrame'
import { type Decimal } from '../lib/decimal'
import { currencyPlaces, formatCurrency, formatPercent, parseInput } from '../lib/format'
import { useSavedState } from '../lib/storage'
import { useSettings } from '../settings'
import { applyDiscount, type DiscountError, type TaxMode } from './discount'

const ERRORS: Record<DiscountError, string> = {
  'negative-price': "The price can't be negative.",
  'discount-range': 'Discounts go from 0% to 100%.',
  'negative-tax': "Tax can't be negative.",
}

const ZERO: Decimal = { units: 0n, scale: 0 }

export default function DiscountTool() {
  const { locale, currency } = useSettings()
  const [s, setS] = useSavedState('discount', {
    price: '',
    discount: '',
    secondDiscount: '',
    tax: '',
    taxMode: 'added' as TaxMode,
  })
  const set = (patch: Partial<typeof s>) => setS((prev) => ({ ...prev, ...patch }))
  const money = (d: Decimal) => formatCurrency(d, currency, locale)
  // The second discount and tax are optional: empty means 0.
  const optional = (text: string) => (text.trim() === '' ? ZERO : parseInput(text, locale))

  const price = parseInput(s.price, locale)
  const discount = parseInput(s.discount, locale)
  const secondDiscount = optional(s.secondDiscount)
  const tax = optional(s.tax)
  const result =
    price && discount && secondDiscount && tax
      ? applyDiscount({ price, discount, secondDiscount, tax, taxMode: s.taxMode, places: currencyPlaces(currency) })
      : null
  const error = result && 'error' in result ? ERRORS[result.error] : null
  const ok = result && !('error' in result) ? result : null
  const hasTax = tax !== null && tax.units !== 0n

  return (
    <>
      <NumberField label="Price" value={s.price} onChange={(price) => set({ price })} suffix={currency} />
      <NumberField label="Discount" value={s.discount} onChange={(discount) => set({ discount })} suffix="%" />
      <NumberField
        label="Then a second discount (optional)"
        value={s.secondDiscount}
        onChange={(secondDiscount) => set({ secondDiscount })}
        suffix="%"
        hint="Taken off the already reduced price."
      />
      <NumberField label="Tax (optional)" value={s.tax} onChange={(tax) => set({ tax })} suffix="%" />
      <Choice
        label="The price"
        value={s.taxMode}
        onChange={(taxMode) => set({ taxMode })}
        options={[
          { value: 'added', label: 'Excludes tax' },
          { value: 'included', label: 'Includes tax' },
        ]}
      />
      {error && (
        <p role="alert" className="font-semibold text-[var(--danger)]">
          {error}
        </p>
      )}
      <Result
        label="You pay"
        value={ok ? money(ok.final) : null}
        detail={ok && hasTax && s.taxMode === 'added' ? `${money(ok.beforeTax)} before tax` : undefined}
      />
      <Result
        label="You save"
        value={ok ? money(ok.saving) : null}
        detail={ok ? `${formatPercent(ok.effectivePercent, locale)} off in total` : undefined}
      />
      {hasTax && (
        <Result
          label={s.taxMode === 'added' ? 'Tax added' : 'Tax included'}
          value={ok ? money(ok.taxAmount) : null}
        />
      )}
    </>
  )
}
