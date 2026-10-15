// App-wide preferences shared by every tool: the currency, which defaults to
// the device locale's and can be changed.

import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { currencyForLocale, deviceLocale } from './lib/format'
import { useSavedState } from './lib/storage'

interface Settings {
  locale: string
  currency: string
  setCurrency: (code: string) => void
}

const SettingsContext = createContext<Settings | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const locale = deviceLocale()
  const [saved, setSaved] = useSavedState('settings', { currency: '' })
  const value = useMemo<Settings>(
    () => ({
      locale,
      currency: saved.currency || currencyForLocale(locale),
      setCurrency: (currency) => setSaved((s) => ({ ...s, currency })),
    }),
    [locale, saved, setSaved],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): Settings {
  const s = useContext(SettingsContext)
  if (!s) throw new Error('useSettings outside SettingsProvider')
  return s
}
