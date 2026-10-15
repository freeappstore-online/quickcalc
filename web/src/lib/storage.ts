// Per-tool inputs kept in localStorage so each tool reopens as it was left.
// Everything stays on the device.

import { useEffect, useState } from 'react'

const PREFIX = 'quickcalc:'

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    // Merge objects so fields added in a later version get their defaults.
    if (isPlainObject(fallback) && isPlainObject(value)) return { ...fallback, ...value } as T
    return typeof value === typeof fallback ? (value as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or blocked (private mode): the tool still works, it just won't remember.
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** useState that is restored from and saved to localStorage under `key`. */
export function useSavedState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => loadJSON(key, initial))
  useEffect(() => saveJSON(key, value), [key, value])
  return [value, setValue]
}
