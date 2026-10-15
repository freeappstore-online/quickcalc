import { Choice, NumberField, Result } from '../components/ToolFrame'
import { type Decimal } from '../lib/decimal'
import { formatNumber, formatPercent, parseInput } from '../lib/format'
import { useSavedState } from '../lib/storage'
import { useSettings } from '../settings'
import { percentChange, percentOf, whatPercent } from './percent'

type Mode = 'of' | 'what' | 'change'

export default function PercentTool() {
  const { locale } = useSettings()
  const [s, setS] = useSavedState('percent', {
    mode: 'of' as Mode,
    ofX: '',
    ofY: '',
    whatX: '',
    whatY: '',
    changeA: '',
    changeB: '',
  })
  const set = (patch: Partial<typeof s>) => setS((prev) => ({ ...prev, ...patch }))
  const read = (text: string) => parseInput(text, locale)
  const num = (d: Decimal) => formatNumber(d, locale, { maxPlaces: 4 })
  const pct = (d: Decimal) => formatPercent(d, locale, 2)

  let body
  if (s.mode === 'of') {
    const x = read(s.ofX)
    const y = read(s.ofY)
    body = (
      <>
        <NumberField label="Percent" value={s.ofX} onChange={(ofX) => set({ ofX })} suffix="%" />
        <NumberField label="Of" value={s.ofY} onChange={(ofY) => set({ ofY })} />
        <Result label="Result" value={x && y ? num(percentOf(x, y)) : null} />
      </>
    )
  } else if (s.mode === 'what') {
    const x = read(s.whatX)
    const y = read(s.whatY)
    const r = x && y ? whatPercent(x, y) : null
    body = (
      <>
        <NumberField label="Value" value={s.whatX} onChange={(whatX) => set({ whatX })} />
        <NumberField label="Of total" value={s.whatY} onChange={(whatY) => set({ whatY })} />
        <Result
          label="Is this percent"
          value={r ? pct(r) : null}
          detail={x && y && !r ? "Undefined: the total can't be 0." : undefined}
        />
      </>
    )
  } else {
    const a = read(s.changeA)
    const b = read(s.changeB)
    const r = a && b ? percentChange(a, b) : null
    body = (
      <>
        <NumberField label="From" value={s.changeA} onChange={(changeA) => set({ changeA })} />
        <NumberField label="To" value={s.changeB} onChange={(changeB) => set({ changeB })} />
        <Result
          label={r && r.units < 0n ? 'Decrease' : 'Change'}
          value={r ? (r.units > 0n ? '+' : '') + pct(r) : null}
          detail={a && b && !r ? 'Undefined: a percent change from 0 has no size.' : undefined}
        />
      </>
    )
  }

  return (
    <>
      <Choice
        label="Calculate"
        value={s.mode}
        onChange={(mode) => set({ mode })}
        options={[
          { value: 'of', label: 'X% of Y' },
          { value: 'what', label: 'X is what % of Y' },
          { value: 'change', label: '% change' },
        ]}
      />
      {body}
    </>
  )
}
