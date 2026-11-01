// The frame every calculator sits in: a header with a way back, large
// phone-friendly inputs, and a result panel with a copy button.

import { type MouseEvent, type ReactNode, useId, useState } from 'react'
import { PageHeader, useDocumentTitle, useToast } from '@freeappstore/sdk/ui'
import { currencyChoices } from '../lib/format'
import { useSettings } from '../settings'

export function ToolFrame({
  title,
  description,
  onBack,
  children,
}: {
  title: string
  description?: string
  /** Click handler for the back link (it is a real link to /, so modified clicks still work). */
  onBack: (e: MouseEvent<HTMLAnchorElement>) => void
  children: ReactNode
}) {
  useDocumentTitle(`${title} — Everyday Calculators`)
  return (
    <>
      <a
        href="/"
        onClick={onBack}
        className="mb-2 inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
      >
        ← All calculators
      </a>
      <PageHeader title={title} description={description} />
      <div className="mt-4 grid gap-4">{children}</div>
    </>
  )
}

/** A big numeric text field. Keeps the raw text so half-typed values ("12.") survive. */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  inputMode = 'decimal',
}: {
  label: string
  value: string
  onChange: (text: string) => void
  suffix?: string
  hint?: string
  inputMode?: 'decimal' | 'numeric'
}) {
  const id = useId()
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-fas border border-line-strong bg-panel-strong px-4 focus-within:border-accent">
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-14 w-full min-w-0 bg-transparent text-2xl font-semibold text-ink outline-none"
        />
        {suffix && <span className="text-lg text-muted">{suffix}</span>}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  )
}

/** The answer, large (a dash and no copy while there is none), with a button that copies it. */
export function Result({ label, value, detail }: { label: string; value: string | null; detail?: string }) {
  const toast = useToast()
  const labelId = useId()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (value === null) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.show('Copied', { variant: 'success' })
    } catch {
      toast.show("Couldn't copy", { variant: 'error' })
    }
  }
  return (
    <section
      aria-labelledby={labelId}
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-fas border border-line bg-accent-soft p-4"
    >
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-semibold text-muted">
          {label}
        </p>
        <p className="display-font break-words text-3xl text-ink sm:text-4xl">{value ?? '—'}</p>
        {detail && <p className="text-sm text-muted">{detail}</p>}
      </div>
      <button
        type="button"
        onClick={copy}
        disabled={value === null}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="min-h-11 shrink-0 rounded-fas-sm border border-line-strong bg-panel-strong px-4 font-semibold text-ink disabled:opacity-40"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </section>
  )
}

/** Picks the currency every money tool uses. */
export function CurrencyPicker() {
  const { currency, setCurrency, locale } = useSettings()
  const id = useId()
  const choices = currencyChoices(locale)
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        Currency
      </label>
      <select
        id={id}
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="min-h-12 rounded-fas border border-line-strong bg-panel-strong px-3 text-ink"
      >
        {!choices.some((c) => c.code === currency) && <option value={currency}>{currency}</option>}
        {choices.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}

/** A row of toggle buttons for picking one option (tip presets, modes). */
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  const id = useId()
  return (
    <div className="grid gap-1">
      <p id={id} className="text-sm font-semibold text-muted">
        {label}
      </p>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className="min-h-12 min-w-14 flex-auto rounded-fas-sm border border-line-strong bg-panel-strong px-3 font-semibold text-ink aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-paper"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A large native date picker. `value` is "YYYY-MM-DD" or "" (empty). */
export function DateField({
  label,
  value,
  onChange,
  hint,
  action,
}: {
  label: string
  value: string
  onChange: (iso: string) => void
  hint?: string
  /** An optional button beside the field, e.g. Today. */
  action?: { label: string; onClick: () => void }
}) {
  const id = useId()
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-14 w-full min-w-0 rounded-fas border border-line-strong bg-panel-strong px-4 text-xl font-semibold text-ink outline-none focus:border-accent"
        />
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="min-h-14 shrink-0 rounded-fas border border-line-strong bg-panel-strong px-4 font-semibold text-ink"
          >
            {action.label}
          </button>
        )}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  )
}
