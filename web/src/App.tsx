import { useEffect, useState } from 'react'
import { initApp } from '@freeappstore/sdk'
import { BuildInfo, type NavItem, PageHeader, Shell } from '@freeappstore/sdk/ui'

const fas = initApp({ appId: 'quickcalc' })

// The app's screens. Shell renders them as its navbar (<nav aria-label="Main">,
// current screen highlighted, a menu on phones). `title` becomes the browser
// tab title on that route.
const NAV: NavItem[] = [
  { label: 'Calculators', href: '/', title: 'Everyday Calculators' },
  { label: 'About', href: '/about', title: 'About — Everyday Calculators' },
]

// The tools planned for v1 (freeappstore-online/platform#185).
const TOOLS = [
  { name: 'Tip & split', what: 'Bill, tip and how much each person pays.' },
  { name: 'Percent', what: 'X% of Y, what percent X is of Y, and % change.' },
  { name: 'Discount', what: 'Sale price with stacked discounts and tax.' },
  { name: 'Age & date', what: 'Exact age, days between dates, and adding days.' },
  { name: 'Fuel', what: 'Trip cost in litres or gallons, km or miles.' },
]

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname)

  // Keep the screen in step with the browser's back and forward buttons.
  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  // Nav clicks switch screens without a page load. Shell scrolls to the top
  // and moves focus to the new screen's PageHeader.
  const navigate = (href: string) => {
    window.history.pushState(null, '', href)
    setPath(href)
  }

  return (
    <Shell app={fas} appName="Everyday Calculators" nav={NAV} onNavigate={navigate}>
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">{path === '/about' ? <About /> : <Calculators />}</div>
      <BuildInfo />
    </Shell>
  )
}

function Calculators() {
  return (
    <>
      <PageHeader title="Calculators" description="Quick, private everyday maths." />
      <ComingSoon />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.name} className="rounded-[var(--radius)] border border-[var(--line)] p-4">
            <p className="font-semibold text-[var(--ink)]">{tool.name}</p>
            <p className="text-sm text-[var(--muted)]">{tool.what}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function About() {
  return (
    <>
      <PageHeader title="About" />
      <ComingSoon />
      <p className="mt-4 text-[var(--muted)]">
        Everyday Calculators will bundle the small calculators people reach for every day: tip and
        split, percent, discount, age and date, and fuel. All the maths will run on your device, so
        it works offline and nothing you type leaves it. No ads.
      </p>
      <p className="mt-4 text-[var(--muted)]">
        Everyday Calculators is a free, MIT-licensed app on{' '}
        <a href="https://freeappstore.online" className="underline">
          FreeAppStore
        </a>
        .
      </p>
    </>
  )
}

// Placeholder until the tools are built. None of them work yet, so it says so plainly.
function ComingSoon() {
  return (
    <p className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4 text-[var(--muted)]">
      Coming soon. Everyday Calculators is in development; the tools below don't calculate anything
      yet.
    </p>
  )
}
