// The calculators, one tile and route each (freeappstore-online/platform#185).
// Each tool's maths lives in calculators/<id>.ts, its screen in calculators/*Tool.tsx.

import type { ComponentType } from 'react'
import DateTool from './calculators/DateTool'
import DiscountTool from './calculators/DiscountTool'
import FuelTool from './calculators/FuelTool'
import PercentTool from './calculators/PercentTool'
import TipTool from './calculators/TipTool'

export interface Tool {
  id: string
  name: string
  what: string
  href: string
  component: ComponentType
}

export const TOOLS: Tool[] = [
  { id: 'tip', name: 'Tip & split', what: 'Bill, tip and how much each person pays.', href: '/tip', component: TipTool },
  { id: 'percent', name: 'Percent', what: 'X% of Y, what percent X is of Y, and % change.', href: '/percent', component: PercentTool },
  { id: 'discount', name: 'Discount', what: 'Sale price with stacked discounts and tax.', href: '/discount', component: DiscountTool },
  { id: 'date', name: 'Age & date', what: 'Exact age, days between dates, adding days or months, and weekdays.', href: '/date', component: DateTool },
  { id: 'fuel', name: 'Fuel', what: 'Trip cost in litres or gallons, km or miles.', href: '/fuel', component: FuelTool },
]

export function toolForPath(path: string): Tool | undefined {
  return TOOLS.find((t) => t.href === path)
}
