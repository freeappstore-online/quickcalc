import { Choice, NumberField, Result } from '../components/ToolFrame'
import { add, dec, fromUnits, normalize, toNumber } from '../lib/decimal'
import { currencyPlaces, formatCurrency, formatPercent, parseInput } from '../lib/format'
import { useSavedState } from '../lib/storage'
import { useSettings } from '../settings'
import { splitTip, type TipError, type TipRounding } from './tip'

const PRESETS = ['10', '15', '18', '20'] as const

const ERRORS: Record<TipError, string> = {
  'no-people': 'Enter at least 1 person.',
  'negative-bill': "The bill can't be negative.",
  'negative-tip': "The tip can't be negative.",
}

export default function TipTool() {
  const { locale, currency } = useSettings()
  const [s, setS] = useSavedState('tip', {
    bill: '',
    tip: '15',
    custom: '',
    people: '2',
    rounding: 'none' as TipRounding,
  })
  const set = (patch: Partial<typeof s>) => setS((prev) => ({ ...prev, ...patch }))

  const places = currencyPlaces(currency)
  const money = (d: ReturnType<typeof dec>) => formatCurrency(d, currency, locale)
  const bill = parseInput(s.bill, locale)
  const tipPercent = parseInput(s.tip === 'custom' ? s.custom : s.tip, locale)
  const peopleDec = parseInput(s.people, locale)
  const people = peopleDec ? toNumber(normalize(peopleDec)) : NaN

  const result = bill && tipPercent && s.people.trim() !== '' ? splitTip({ bill, tipPercent, people, rounding: s.rounding, places }) : null
  const error = result && 'error' in result ? ERRORS[result.error] : null
  const ok = result && !('error' in result) ? result : null

  let shareDetail: string | undefined
  if (ok && ok.extraPeople > 0) {
    const more = money(add(ok.share, fromUnits(1n, places)))
    shareDetail =
      ok.extraPeople === 1
        ? `1 person pays ${more} so the total adds up.`
        : `${ok.extraPeople} people pay ${more} so the total adds up.`
  }

  return (
    <>
      <NumberField label="Bill" value={s.bill} onChange={(bill) => set({ bill })} suffix={currency} />
      <Choice
        label="Tip"
        value={s.tip}
        onChange={(tip) => set({ tip })}
        options={[...PRESETS.map((p) => ({ value: p as string, label: `${p}%` })), { value: 'custom', label: 'Custom' }]}
      />
      {s.tip === 'custom' && (
        <NumberField label="Custom tip" value={s.custom} onChange={(custom) => set({ custom })} suffix="%" />
      )}
      <NumberField
        label="People"
        value={s.people}
        onChange={(people) => set({ people })}
        inputMode="numeric"
      />
      <Choice
        label="Round up"
        value={s.rounding}
        onChange={(rounding) => set({ rounding })}
        options={[
          { value: 'none', label: 'No' },
          { value: 'total', label: 'Total' },
          { value: 'person', label: 'Per person' },
        ]}
      />
      {error && (
        <p role="alert" className="font-semibold text-[var(--danger)]">
          {error}
        </p>
      )}
      <Result label="Each person pays" value={ok ? money(ok.share) : null} detail={shareDetail} />
      <Result
        label="Total with tip"
        value={ok ? money(ok.total) : null}
        detail={
          ok
            ? `Tip ${money(ok.tip)}${ok.effectivePercent && s.rounding !== 'none' ? ` (${formatPercent(ok.effectivePercent, locale)})` : ''}`
            : undefined
        }
      />
    </>
  )
}
