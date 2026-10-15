import { Choice, NumberField, Result } from '../components/ToolFrame'
import { add, dec, type Decimal, fromUnits, normalize, toNumber } from '../lib/decimal'
import { currencyPlaces, formatCurrency, formatNumber, parseInput } from '../lib/format'
import { useSavedState } from '../lib/storage'
import { useSettings } from '../settings'
import { type FuelEntry, type FuelUnits, switchUnits, tripCost, type TripError } from './fuel'
import { splitTip } from './tip'

const LABELS: Record<FuelUnits, { distance: string; consumption: string; fuel: string; per: string }> = {
  metric: { distance: 'km', consumption: 'L/100km', fuel: 'L', per: 'litre' },
  us: { distance: 'miles', consumption: 'mpg (US)', fuel: 'US gal', per: 'US gallon' },
  uk: { distance: 'miles', consumption: 'mpg (UK)', fuel: 'UK gal', per: 'UK gallon' },
}

const ERRORS: Record<TripError, string> = {
  negative: "Values can't be negative.",
  'zero-mpg': 'Fuel economy must be more than 0 mpg.',
}

export default function FuelTool() {
  const { locale, currency } = useSettings()
  const [s, setS] = useSavedState('fuel', {
    units: 'metric' as FuelUnits,
    distance: '',
    consumption: '',
    price: '',
    origin: null as FuelEntry['origin'],
    trip: 'one' as 'one' | 'round',
    people: '1',
  })
  const set = (patch: Partial<typeof s>) => setS((prev) => ({ ...prev, ...patch }))
  const label = LABELS[s.units] ?? LABELS.metric
  const places = currencyPlaces(currency)
  const money = (d: Decimal) => formatCurrency(d, currency, locale)

  const distance = parseInput(s.distance, locale)
  const consumption = parseInput(s.consumption, locale)
  const price = parseInput(s.price, locale)
  const result =
    distance && consumption && price
      ? tripCost({ units: s.units, distance, consumption, price, roundTrip: s.trip === 'round' })
      : null
  const error = result && 'error' in result ? ERRORS[result.error] : null
  const ok = result && !('error' in result) ? result : null

  // Splitting reuses the tip maths with no tip, so the shares add up to the cost.
  const peopleDec = parseInput(s.people, locale)
  const people = peopleDec ? toNumber(normalize(peopleDec)) : NaN
  const split = ok && people > 1 ? splitTip({ bill: ok.cost, tipPercent: dec(0), people, rounding: 'none', places }) : null
  const share = split && !('error' in split) ? split : null

  return (
    <>
      <Choice
        label="Units"
        value={s.units}
        onChange={(units) => setS((prev) => ({ ...prev, ...switchUnits(prev, units, locale) }))}
        options={[
          { value: 'metric', label: 'km · L/100km' },
          { value: 'us', label: 'miles · US mpg' },
          { value: 'uk', label: 'miles · UK mpg' },
        ]}
      />
      <NumberField label="Distance" value={s.distance} onChange={(distance) => set({ distance })} suffix={label.distance} />
      <Choice
        label="Trip"
        value={s.trip}
        onChange={(trip) => set({ trip })}
        options={[
          { value: 'one', label: 'One way' },
          { value: 'round', label: 'Round trip' },
        ]}
      />
      <NumberField
        label="Fuel economy"
        value={s.consumption}
        onChange={(consumption) => set({ consumption })}
        suffix={label.consumption}
      />
      <NumberField
        label={`Price per ${label.per}`}
        value={s.price}
        onChange={(price) => set({ price })}
        suffix={currency}
      />
      <NumberField
        label="Split between"
        value={s.people}
        onChange={(people) => set({ people })}
        suffix="people"
        inputMode="numeric"
      />
      {error && (
        <p role="alert" className="font-semibold text-[var(--danger)]">
          {error}
        </p>
      )}
      <Result
        label="Trip cost"
        value={ok ? money(ok.cost) : null}
        detail={
          ok
            ? `${formatNumber(ok.fuel, locale)} ${label.fuel} of fuel for ${formatNumber(ok.distance, locale)} ${label.distance}`
            : undefined
        }
      />
      {people > 1 && (
        <Result
          label="Each person pays"
          value={share ? money(share.share) : null}
          detail={
            share && share.extraPeople > 0
              ? `${share.extraPeople === 1 ? '1 person pays' : `${share.extraPeople} people pay`} ${money(add(share.share, fromUnits(1n, places)))} so the total adds up.`
              : undefined
          }
        />
      )}
    </>
  )
}
