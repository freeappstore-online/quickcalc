// Calendar-date maths for the Age & date tool. Dates are plain year/month/day
// values and all arithmetic is on whole day numbers, never on Date instants,
// so time of day, time zones and DST can't shift a result by a day. The one
// place a time zone matters is working out what "today" is.

export interface CalDate {
  year: number
  /** 1–12 */
  month: number
  day: number
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** Reads "YYYY-MM-DD" (what <input type="date"> gives); null if it isn't a real date. */
export function parseISODate(text: string): CalDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim())
  if (!m) return null
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function toISODate(d: CalDate): string {
  const pad = (n: number, w: number) => String(n).padStart(w, '0')
  return `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`
}

/** Days since 1970-01-01 in the proleptic Gregorian calendar (H. Hinnant's days_from_civil). */
export function dayNumber({ year, month, day }: CalDate): number {
  const y = month <= 2 ? year - 1 : year
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

export function fromDayNumber(n: number): CalDate {
  const z = n + 719468
  const era = Math.floor(z / 146097)
  const doe = z - era * 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1
  const month = mp < 10 ? mp + 3 : mp - 9
  return { year: era * 400 + yoe + (month <= 2 ? 1 : 0), month, day }
}

export function compareDates(a: CalDate, b: CalDate): number {
  return dayNumber(a) - dayNumber(b)
}

/** Days from a to b: positive when b is later, negative when earlier. */
export function daysBetween(a: CalDate, b: CalDate): number {
  return dayNumber(b) - dayNumber(a)
}

export function addDays(d: CalDate, days: number): CalDate {
  return fromDayNumber(dayNumber(d) + days)
}

/**
 * Adds whole months, keeping the day of the month but clamping it to the
 * month's end: 31 Jan + 1 month is 28 Feb (29 Feb in a leap year).
 */
export function addMonths(d: CalDate, months: number): CalDate {
  const index = d.year * 12 + (d.month - 1) + months
  const year = Math.floor(index / 12)
  const month = index - year * 12 + 1
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) }
}

/** ISO weekday: 1 is Monday, 7 is Sunday. */
export function weekday(d: CalDate): number {
  // 1970-01-01 was a Thursday (4).
  return ((((dayNumber(d) + 3) % 7) + 7) % 7) + 1
}

export interface Age {
  years: number
  months: number
  days: number
  totalDays: number
}

/**
 * Exact age on a date, or null when `on` is before `birth`. Months are counted
 * the way addMonths moves, so someone born on 29 Feb turns a year older on
 * 28 Feb in common years, and someone born on 31 Jan is a month old on 28 Feb.
 */
export function age(birth: CalDate, on: CalDate): Age | null {
  if (compareDates(on, birth) < 0) return null
  let months = (on.year - birth.year) * 12 + (on.month - birth.month)
  if (compareDates(addMonths(birth, months), on) > 0) months--
  const days = daysBetween(addMonths(birth, months), on)
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days,
    totalDays: daysBetween(birth, on),
  }
}

/** Days until the next birthday after `on` (0 when `on` is the birthday). */
export function daysToBirthday(birth: CalDate, on: CalDate): number | null {
  const a = age(birth, on)
  if (!a) return null
  if (a.months === 0 && a.days === 0) return 0
  return daysBetween(on, addMonths(birth, (a.years + 1) * 12))
}

/**
 * The calendar date at an instant in a time zone (the device's by default).
 * 23:30 UTC on 1 Mar is still 1 Mar in New York but already 2 Mar in Tokyo.
 */
export function dateInZone(instant: Date, timeZone?: string): CalDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

export function today(timeZone?: string): CalDate {
  return dateInZone(new Date(), timeZone)
}

/**
 * A date in the device's locale format. Formatted as midnight UTC in UTC, so
 * the device's time zone can't move it to the day before or after.
 */
export function formatDate(d: CalDate, locale: string, style: 'full' | 'long' | 'medium' = 'full'): string {
  const instant = new Date(0)
  instant.setUTCFullYear(d.year, d.month - 1, d.day)
  return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: 'UTC' }).format(instant)
}

export function formatWeekday(d: CalDate, locale: string): string {
  const instant = new Date(0)
  instant.setUTCFullYear(d.year, d.month - 1, d.day)
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(instant)
}
