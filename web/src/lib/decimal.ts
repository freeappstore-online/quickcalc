// Exact decimal maths for the calculators. A Decimal is an integer number of
// units at a given scale (digits after the point): 12.34 is { units: 1234n,
// scale: 2 }. BigInt keeps sums, products and huge values exact, so
// 0.1 + 0.2 is 0.3, never 0.30000000000000004.

export interface Decimal {
  readonly units: bigint
  readonly scale: number
}

const DECIMAL_RE = /^([+-]?)(\d*)(?:\.(\d*))?$/

function pow10(n: number): bigint {
  return 10n ** BigInt(n)
}

function abs(n: bigint): bigint {
  return n < 0n ? -n : n
}

/** Reads a plain decimal string ("12", "-0.5", ".25", "1e3" is not accepted). */
export function parse(input: string): Decimal | null {
  const m = DECIMAL_RE.exec(input.trim())
  if (!m) return null
  const [, sign, whole = '', frac = ''] = m
  if (whole === '' && frac === '') return null
  const units = BigInt((whole || '0') + frac)
  return { units: sign === '-' ? -units : units, scale: frac.length }
}

/** Like parse, but throws on bad input. Handy for constants and tests. */
export function dec(input: string | number | bigint): Decimal {
  if (typeof input === 'bigint') return { units: input, scale: 0 }
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new RangeError(`Not a finite number: ${input}`)
    // Shortest round-trip form of the float, e.g. 0.1 -> "0.1".
    input = toPlainString(input)
  }
  const d = parse(input)
  if (!d) throw new SyntaxError(`Not a decimal: ${input}`)
  return d
}

// Number#toString switches to exponent form for very large and small values.
function toPlainString(n: number): string {
  const s = String(n)
  const m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(s)
  if (!m) return s
  const [, sign, lead, rest = '', expStr] = m
  const exp = Number(expStr)
  const digits = lead + rest
  if (exp >= 0) {
    if (digits.length <= exp + 1) return sign + digits.padEnd(exp + 1, '0')
    return `${sign}${digits.slice(0, exp + 1)}.${digits.slice(exp + 1)}`
  }
  return `${sign}0.${'0'.repeat(-exp - 1)}${digits}`
}

/** Rescales to a larger scale without changing the value. */
function widen(a: Decimal, scale: number): bigint {
  return a.units * pow10(scale - a.scale)
}

/** Drops trailing zeros after the point: 1.500 -> 1.5. */
export function normalize(a: Decimal): Decimal {
  let { units, scale } = a
  while (scale > 0 && units % 10n === 0n) {
    units /= 10n
    scale--
  }
  return { units, scale }
}

export function add(a: Decimal, b: Decimal): Decimal {
  const scale = Math.max(a.scale, b.scale)
  return normalize({ units: widen(a, scale) + widen(b, scale), scale })
}

export function sub(a: Decimal, b: Decimal): Decimal {
  return add(a, neg(b))
}

export function neg(a: Decimal): Decimal {
  return { units: -a.units, scale: a.scale }
}

export function mul(a: Decimal, b: Decimal): Decimal {
  return normalize({ units: a.units * b.units, scale: a.scale + b.scale })
}

/** Integer division rounding half away from zero. */
function divRound(n: bigint, d: bigint): bigint {
  const q = n / d
  const r = n % d
  if (abs(r) * 2n >= abs(d)) return q + ((n < 0n) !== (d < 0n) ? -1n : 1n)
  return q
}

/**
 * a / b rounded half-up (away from zero) to `places` digits. Division is the
 * one operation that can't always be exact, so it always takes a precision.
 */
export function div(a: Decimal, b: Decimal, places = 12): Decimal {
  if (b.units === 0n) throw new RangeError('Division by zero')
  // a/b = (a.units / b.units) * 10^(b.scale - a.scale); want units at `places`.
  const shift = places + b.scale - a.scale
  const n = shift >= 0 ? a.units * pow10(shift) : a.units
  const d = shift >= 0 ? b.units : b.units * pow10(-shift)
  return normalize({ units: divRound(n, d), scale: places })
}

/**
 * Rounds to `places` digits, half-up: halves go away from zero, so 2.345 ->
 * 2.35 and -2.345 -> -2.35 (the usual rule for money).
 */
export function round(a: Decimal, places = 2): Decimal {
  if (a.scale <= places) return a
  return { units: divRound(a.units, pow10(a.scale - places)), scale: places }
}

export function cmp(a: Decimal, b: Decimal): -1 | 0 | 1 {
  const scale = Math.max(a.scale, b.scale)
  const x = widen(a, scale)
  const y = widen(b, scale)
  return x < y ? -1 : x > y ? 1 : 0
}

export function isZero(a: Decimal): boolean {
  return a.units === 0n
}

/** Exact plain string, padded to `minPlaces` digits after the point. */
export function toString(a: Decimal, minPlaces = 0): string {
  const scale = Math.max(a.scale, minPlaces)
  const units = widen(a, scale)
  const digits = abs(units).toString().padStart(scale + 1, '0')
  const whole = digits.slice(0, digits.length - scale)
  const frac = digits.slice(digits.length - scale)
  return (units < 0n ? '-' : '') + whole + (scale > 0 ? `.${frac}` : '')
}

/** Nearest float, for things like charts. Not for further maths. */
export function toNumber(a: Decimal): number {
  return Number(toString(a))
}

/** The value as a whole number of 10^-places units, rounded half-up: 12.345 at 2 -> 1235n. */
export function toUnits(a: Decimal, places: number): bigint {
  const r = round(a, places)
  return widen(r, places)
}

/** The inverse of toUnits: 1235n at 2 places -> 12.35. */
export function fromUnits(units: bigint, places: number): Decimal {
  return normalize({ units, scale: places })
}
