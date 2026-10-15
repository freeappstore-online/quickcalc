import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  age,
  type CalDate,
  dateInZone,
  dayNumber,
  daysBetween,
  daysInMonth,
  daysToBirthday,
  formatDate,
  formatWeekday,
  fromDayNumber,
  isLeapYear,
  parseISODate,
  toISODate,
  weekday,
} from './date'

const d = (iso: string): CalDate => {
  const r = parseISODate(iso)
  if (!r) throw new Error(`bad date ${iso}`)
  return r
}
const iso = toISODate

describe('calendar basics', () => {
  it('knows leap years', () => {
    expect([1900, 2000, 2023, 2024, 2100, 2400].map(isLeapYear)).toEqual([false, true, false, true, false, true])
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2023, 2)).toBe(28)
    expect(daysInMonth(2023, 4)).toBe(30)
    expect(daysInMonth(2023, 12)).toBe(31)
  })

  it('parses only real dates', () => {
    expect(parseISODate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 })
    expect(parseISODate('2023-02-29')).toBeNull()
    expect(parseISODate('2023-04-31')).toBeNull()
    expect(parseISODate('2023-13-01')).toBeNull()
    expect(parseISODate('')).toBeNull()
    expect(parseISODate('29/02/2024')).toBeNull()
  })

  it('round-trips day numbers', () => {
    expect(dayNumber(d('1970-01-01'))).toBe(0)
    expect(dayNumber(d('2000-03-01'))).toBe(11017)
    for (let n = -800000; n < 800000; n += 997) expect(dayNumber(fromDayNumber(n))).toBe(n)
    expect(iso(fromDayNumber(dayNumber(d('0001-01-01'))))).toBe('0001-01-01')
  })
})

describe('days between', () => {
  it('counts across leap days and year boundaries', () => {
    expect(daysBetween(d('2024-02-28'), d('2024-03-01'))).toBe(2)
    expect(daysBetween(d('2023-02-28'), d('2023-03-01'))).toBe(1)
    expect(daysBetween(d('2023-12-31'), d('2024-01-01'))).toBe(1)
    expect(daysBetween(d('2024-01-01'), d('2025-01-01'))).toBe(366)
    expect(daysBetween(d('2023-01-01'), d('2024-01-01'))).toBe(365)
  })

  it('is 0 on the same day and negative when the end is before the start', () => {
    expect(daysBetween(d('2024-05-05'), d('2024-05-05'))).toBe(0)
    expect(daysBetween(d('2024-01-10'), d('2024-01-01'))).toBe(-9)
  })

  it('is not thrown off by DST changes', () => {
    // US clocks spring forward on 2026-03-08 and fall back on 2026-11-01.
    expect(daysBetween(d('2026-03-07'), d('2026-03-09'))).toBe(2)
    expect(daysBetween(d('2026-10-31'), d('2026-11-02'))).toBe(2)
    expect(iso(addDays(d('2026-03-08'), 1))).toBe('2026-03-09')
  })
})

describe('adding days, weeks and months', () => {
  it('adds and subtracts days across month and year ends', () => {
    expect(iso(addDays(d('2024-01-31'), 1))).toBe('2024-02-01')
    expect(iso(addDays(d('2024-02-28'), 1))).toBe('2024-02-29')
    expect(iso(addDays(d('2023-02-28'), 1))).toBe('2023-03-01')
    expect(iso(addDays(d('2023-12-31'), 1))).toBe('2024-01-01')
    expect(iso(addDays(d('2024-01-01'), -1))).toBe('2023-12-31')
    expect(iso(addDays(d('2024-03-01'), -7 * 2))).toBe('2024-02-16')
  })

  it('clamps month ends: 31 Jan + 1 month', () => {
    expect(iso(addMonths(d('2023-01-31'), 1))).toBe('2023-02-28')
    expect(iso(addMonths(d('2024-01-31'), 1))).toBe('2024-02-29')
    expect(iso(addMonths(d('2024-03-31'), 1))).toBe('2024-04-30')
    expect(iso(addMonths(d('2024-03-31'), -1))).toBe('2024-02-29')
    expect(iso(addMonths(d('2024-02-29'), 12))).toBe('2025-02-28')
    expect(iso(addMonths(d('2024-02-29'), 48))).toBe('2028-02-29')
  })

  it('crosses year boundaries both ways', () => {
    expect(iso(addMonths(d('2023-11-15'), 3))).toBe('2024-02-15')
    expect(iso(addMonths(d('2024-01-15'), -1))).toBe('2023-12-15')
    expect(iso(addMonths(d('2024-01-15'), -25))).toBe('2021-12-15')
  })
})

describe('weekday', () => {
  it('finds the weekday of any date', () => {
    expect(weekday(d('1970-01-01'))).toBe(4) // Thursday
    expect(weekday(d('2024-02-29'))).toBe(4) // Thursday
    expect(weekday(d('2000-01-01'))).toBe(6) // Saturday
    expect(weekday(d('1969-12-28'))).toBe(7) // Sunday
    expect(weekday(d('2026-10-19'))).toBe(1) // Monday
  })
})

describe('age', () => {
  const ymd = (birth: string, on: string) => {
    const a = age(d(birth), d(on))
    return a && [a.years, a.months, a.days, a.totalDays]
  }

  it('gives years, months and days', () => {
    expect(ymd('1990-06-15', '2026-10-16')).toEqual([36, 4, 1, 13272])
    expect(ymd('2000-01-01', '2000-12-31')).toEqual([0, 11, 30, 365])
  })

  it('is zero on the same day', () => {
    expect(ymd('2024-05-05', '2024-05-05')).toEqual([0, 0, 0, 0])
  })

  it('is null when the date is before the birth date', () => {
    expect(age(d('2024-05-05'), d('2024-05-04'))).toBeNull()
  })

  it('handles birthdays on 29 Feb', () => {
    expect(ymd('2024-02-29', '2025-02-27')).toEqual([0, 11, 29, 364])
    expect(ymd('2024-02-29', '2025-02-28')).toEqual([1, 0, 0, 365])
    expect(ymd('2024-02-29', '2025-03-01')).toEqual([1, 0, 1, 366])
    expect(ymd('2024-02-29', '2028-02-29')).toEqual([4, 0, 0, 1461])
    expect(daysToBirthday(d('2024-02-29'), d('2025-03-01'))).toBe(364) // 2026-02-28
  })

  it('handles month ends', () => {
    expect(ymd('2023-01-31', '2023-02-28')).toEqual([0, 1, 0, 28])
    expect(ymd('2023-01-31', '2023-03-01')).toEqual([0, 1, 1, 29])
    expect(ymd('2023-01-31', '2023-03-31')).toEqual([0, 2, 0, 59])
  })

  it('crosses year boundaries', () => {
    expect(ymd('2023-12-31', '2024-01-01')).toEqual([0, 0, 1, 1])
    expect(ymd('2023-12-15', '2024-01-14')).toEqual([0, 0, 30, 30])
    expect(ymd('2023-12-15', '2024-12-15')).toEqual([1, 0, 0, 366])
  })

  it('counts days to the next birthday', () => {
    expect(daysToBirthday(d('1990-06-15'), d('2026-06-15'))).toBe(0)
    expect(daysToBirthday(d('1990-06-15'), d('2026-06-14'))).toBe(1)
    expect(daysToBirthday(d('1990-12-31'), d('2026-01-01'))).toBe(364)
  })
})

describe('time zones', () => {
  it('reads "today" in the given time zone', () => {
    const lateUTC = new Date(Date.UTC(2026, 2, 1, 23, 30)) // 2026-03-01 23:30 UTC
    expect(iso(dateInZone(lateUTC, 'UTC'))).toBe('2026-03-01')
    expect(iso(dateInZone(lateUTC, 'America/New_York'))).toBe('2026-03-01')
    expect(iso(dateInZone(lateUTC, 'Asia/Tokyo'))).toBe('2026-03-02')
    expect(iso(dateInZone(lateUTC, 'Pacific/Kiritimati'))).toBe('2026-03-02')
    const earlyUTC = new Date(Date.UTC(2026, 0, 1, 2, 0)) // 2026-01-01 02:00 UTC
    expect(iso(dateInZone(earlyUTC, 'America/Los_Angeles'))).toBe('2025-12-31')
    expect(iso(dateInZone(earlyUTC, 'Europe/Berlin'))).toBe('2026-01-01')
  })

  it('formats a date without shifting it to a neighbouring day', () => {
    // Formatted in UTC, so zones far from UTC (or the test machine's) can't move it.
    expect(formatDate(d('2024-02-29'), 'en-US')).toBe('Thursday, February 29, 2024')
    expect(formatDate(d('2024-02-29'), 'de-DE')).toBe('Donnerstag, 29. Februar 2024')
    expect(formatDate(d('2024-01-01'), 'ja-JP')).toBe('2024年1月1日月曜日')
    expect(formatDate(d('0050-03-01'), 'en-US', 'medium')).toBe('Mar 1, 50')
    expect(formatWeekday(d('2000-01-01'), 'en-GB')).toBe('Saturday')
  })
})
