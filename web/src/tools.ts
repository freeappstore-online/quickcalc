// The calculators, one tile and route each (freeappstore-online/platform#185).
// `ready` flips to true as each tool is built.

export interface Tool {
  id: string
  name: string
  what: string
  href: string
  ready: boolean
}

export const TOOLS: Tool[] = [
  { id: 'tip', name: 'Tip & split', what: 'Bill, tip and how much each person pays.', href: '/tip', ready: false },
  { id: 'percent', name: 'Percent', what: 'X% of Y, what percent X is of Y, and % change.', href: '/percent', ready: false },
  { id: 'discount', name: 'Discount', what: 'Sale price with stacked discounts and tax.', href: '/discount', ready: false },
  { id: 'date', name: 'Age & date', what: 'Exact age, days between dates, and adding days.', href: '/date', ready: false },
  { id: 'fuel', name: 'Fuel', what: 'Trip cost in litres or gallons, km or miles.', href: '/fuel', ready: false },
]

export function toolForPath(path: string): Tool | undefined {
  return TOOLS.find((t) => t.href === path)
}
