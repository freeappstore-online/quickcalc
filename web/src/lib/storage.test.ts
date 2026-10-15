import { beforeEach, describe, expect, it } from 'vitest'
import { loadJSON, saveJSON } from './storage'

// A minimal in-memory localStorage for the Node test environment.
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  } satisfies Storage,
})

describe('saved inputs', () => {
  beforeEach(() => store.clear())

  it('restores what was saved, per tool', () => {
    saveJSON('tip', { bill: '42.50', people: '3' })
    saveJSON('fuel', { distance: '120' })
    expect(loadJSON('tip', { bill: '', people: '1' })).toEqual({ bill: '42.50', people: '3' })
    expect(loadJSON('fuel', { distance: '' })).toEqual({ distance: '120' })
    expect(store.has('quickcalc:tip')).toBe(true)
  })

  it('fills fields added later with their defaults', () => {
    saveJSON('tip', { bill: '10' })
    expect(loadJSON('tip', { bill: '', tip: '15' })).toEqual({ bill: '10', tip: '15' })
  })

  it('falls back on missing, corrupt or mistyped data', () => {
    expect(loadJSON('none', { a: 1 })).toEqual({ a: 1 })
    store.set('quickcalc:bad', '{not json')
    expect(loadJSON('bad', { a: 1 })).toEqual({ a: 1 })
    saveJSON('n', 'text')
    expect(loadJSON('n', 5)).toBe(5)
  })
})
