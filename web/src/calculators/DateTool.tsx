import { Choice, DateField, NumberField, Result } from '../components/ToolFrame'
import { normalize } from '../lib/decimal'
import { parseInput } from '../lib/format'
import { useSavedState } from '../lib/storage'
import { useSettings } from '../settings'
import {
  addDays,
  addMonths,
  age,
  type CalDate,
  daysBetween,
  daysToBirthday,
  formatDate,
  formatWeekday,
  parseISODate,
  toISODate,
  today,
} from './date'

type Mode = 'age' | 'between' | 'add' | 'weekday'
type Unit = 'days' | 'weeks' | 'months'

export default function DateTool() {
  const { locale } = useSettings()
  const [s, setS] = useSavedState('date', {
    mode: 'age' as Mode,
    birth: '',
    ageOn: '',
    from: '',
    to: '',
    start: '',
    amount: '',
    unit: 'days' as Unit,
    direction: 'add' as 'add' | 'subtract',
    weekdayOf: '',
  })
  const set = (patch: Partial<typeof s>) => setS((prev) => ({ ...prev, ...patch }))
  const now = today()
  const todayISO = toISODate(now)
  // Empty "on" dates mean today, so a saved age stays current.
  const orToday = (iso: string): CalDate | null => (iso === '' ? now : parseISODate(iso))
  const count = (n: number, word: string) =>
    `${new Intl.NumberFormat(locale).format(n)} ${word}${Math.abs(n) === 1 ? '' : 's'}`
  const todayAction = (key: keyof typeof s) => ({ label: 'Today', onClick: () => set({ [key]: todayISO }) })

  let body
  if (s.mode === 'age') {
    const birth = parseISODate(s.birth)
    const on = orToday(s.ageOn)
    const a = birth && on ? age(birth, on) : null
    const next = birth && on ? daysToBirthday(birth, on) : null
    body = (
      <>
        <DateField label="Date of birth" value={s.birth} onChange={(birth) => set({ birth })} />
        <DateField
          label="Age on"
          value={s.ageOn}
          onChange={(ageOn) => set({ ageOn })}
          hint="Leave empty for today."
          action={{ label: 'Today', onClick: () => set({ ageOn: '' }) }}
        />
        <Result
          label="Age"
          value={a ? `${count(a.years, 'year')}, ${count(a.months, 'month')}, ${count(a.days, 'day')}` : null}
          detail={
            a
              ? `${count(a.totalDays, 'day')} in total · ${next === 0 ? 'birthday today' : `next birthday in ${count(next ?? 0, 'day')}`}`
              : birth && on
                ? 'The date is before the date of birth.'
                : undefined
          }
        />
      </>
    )
  } else if (s.mode === 'between') {
    const from = orToday(s.from)
    const to = parseISODate(s.to)
    const days = from && to ? daysBetween(from, to) : null
    const abs = days === null ? 0 : Math.abs(days)
    body = (
      <>
        <DateField
          label="From"
          value={s.from}
          onChange={(from) => set({ from })}
          hint="Leave empty for today."
          action={{ label: 'Today', onClick: () => set({ from: '' }) }}
        />
        <DateField label="To" value={s.to} onChange={(to) => set({ to })} action={todayAction('to')} />
        <Result
          label="Days between"
          value={days === null ? null : count(days, 'day')}
          detail={
            days === null
              ? undefined
              : days < 0
                ? 'The end date is before the start date.'
                : abs >= 7
                  ? `${count(Math.floor(abs / 7), 'week')} and ${count(abs % 7, 'day')}`
                  : undefined
          }
        />
      </>
    )
  } else if (s.mode === 'add') {
    const start = orToday(s.start)
    const n = parseInput(s.amount, locale)
    const whole = n && normalize(n).scale === 0 && n.units >= 0n ? Number(normalize(n).units) : null
    let result: CalDate | null = null
    if (start && whole !== null && Number.isSafeInteger(whole)) {
      const signed = s.direction === 'add' ? whole : -whole
      result =
        s.unit === 'months'
          ? addMonths(start, signed)
          : addDays(start, s.unit === 'weeks' ? signed * 7 : signed)
      if (result.year < 1 || result.year > 9999) result = null
    }
    body = (
      <>
        <DateField
          label="Start"
          value={s.start}
          onChange={(start) => set({ start })}
          hint="Leave empty for today."
          action={{ label: 'Today', onClick: () => set({ start: '' }) }}
        />
        <Choice
          label="Direction"
          value={s.direction}
          onChange={(direction) => set({ direction })}
          options={[
            { value: 'add', label: 'Add' },
            { value: 'subtract', label: 'Subtract' },
          ]}
        />
        <NumberField label="How many" value={s.amount} onChange={(amount) => set({ amount })} inputMode="numeric" />
        <Choice
          label="Unit"
          value={s.unit}
          onChange={(unit) => set({ unit })}
          options={[
            { value: 'days', label: 'Days' },
            { value: 'weeks', label: 'Weeks' },
            { value: 'months', label: 'Months' },
          ]}
        />
        <Result
          label="Date"
          value={result ? formatDate(result, locale) : null}
          detail={
            s.amount.trim() !== '' && whole === null
              ? 'Enter a whole number.'
              : s.unit === 'months' && result && start && result.day !== start.day
                ? 'Moved to the last day of the month.'
                : undefined
          }
        />
      </>
    )
  } else {
    const date = orToday(s.weekdayOf)
    body = (
      <>
        <DateField
          label="Date"
          value={s.weekdayOf}
          onChange={(weekdayOf) => set({ weekdayOf })}
          hint="Leave empty for today."
        />
        <Result
          label="Weekday"
          value={date ? formatWeekday(date, locale) : null}
          detail={date ? formatDate(date, locale, 'long') : undefined}
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
          { value: 'age', label: 'Age' },
          { value: 'between', label: 'Days between' },
          { value: 'add', label: 'Add or subtract' },
          { value: 'weekday', label: 'Weekday' },
        ]}
      />
      {body}
    </>
  )
}
