import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { initApp } from '@freeappstore/sdk'
import { BuildInfo, type NavItem, PageHeader, Shell } from '@freeappstore/sdk/ui'
import { CurrencyPicker, ToolFrame } from './components/ToolFrame'
import { SettingsProvider } from './settings'
import { type Tool, TOOLS, toolForPath } from './tools'

const fas = initApp({ appId: 'quickcalc' })

// The app's screens. Shell renders them as its navbar (<nav aria-label="Main">,
// current screen highlighted, a menu on phones). `title` becomes the browser
// tab title on that route. Each calculator has its own route, reached from a
// tile on the Calculators screen.
const NAV: NavItem[] = [
  { label: 'Calculators', href: '/', title: 'Everyday Calculators' },
  { label: 'About', href: '/about', title: 'About — Everyday Calculators' },
]

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const page = useRef<HTMLDivElement>(null)

  // Screens scroll inside the frame, so a new screen starts at its top.
  useEffect(() => {
    page.current?.scrollTo(0, 0)
  }, [path])

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
    <SettingsProvider>
      <Shell app={fas} appName="Everyday Calculators" nav={NAV} onNavigate={navigate}>
        {/* Each screen scrolls inside the app frame; the page itself never does. */}
        <div ref={page} className="qc-page">
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
            <Screen path={path} navigate={navigate} />
          </div>
          <BuildInfo />
        </div>
      </Shell>
    </SettingsProvider>
  )
}

/** A plain left click becomes client-side navigation; modified clicks open as links. */
function linkClick(navigate: (href: string) => void, href: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(href)
  }
}

function Screen({ path, navigate }: { path: string; navigate: (href: string) => void }) {
  if (path === '/about') return <About />
  const tool = toolForPath(path)
  if (tool) return <ToolScreen tool={tool} navigate={navigate} />
  return <Calculators navigate={navigate} />
}

// One tile per tool; each opens the tool's own route.
function Calculators({ navigate }: { navigate: (href: string) => void }) {
  return (
    <>
      <PageHeader title="Calculators" description="Quick, private everyday maths." />
      <p className="mt-2 text-[var(--muted)]">
        Pick a calculator. Everything works offline, and nothing you type leaves your device.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.id}>
            <a
              href={tool.href}
              onClick={linkClick(navigate, tool.href)}
              className="block min-h-20 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4 hover:border-[var(--accent)]"
            >
              <span className="block font-semibold text-[var(--ink)]">{tool.name}</span>
              <span className="block text-sm text-[var(--muted)]">{tool.what}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-6 max-w-sm">
        <CurrencyPicker />
      </div>
    </>
  )
}

function ToolScreen({ tool, navigate }: { tool: Tool; navigate: (href: string) => void }) {
  return (
    <ToolFrame title={tool.name} description={tool.what} onBack={linkClick(navigate, '/')}>
      <tool.component />
    </ToolFrame>
  )
}

function About() {
  return (
    <>
      <PageHeader title="About" />
      <p className="mt-4 text-[var(--muted)]">
        Everyday Calculators bundles the small calculators people reach for every day: tip and
        split, percent, discount, age and date, and fuel. All the maths runs on your device, so it
        works offline. No ads.
      </p>
      <section
        id="privacy"
        aria-labelledby="privacy-title"
        className="mt-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4"
      >
        <h2 id="privacy-title" className="text-lg font-bold text-[var(--ink)]">
          Privacy
        </h2>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--ink)]">Every calculation stays on your device.</strong>{' '}
            Nothing you type is uploaded: all the maths runs in this browser.
          </li>
          <li>
            Each calculator's last inputs and your currency are saved on this device only, in this
            browser's storage for the site (localStorage), so they're there when you come back.
            They aren't kept in your FreeAppStore account, backed up or synced. Clearing this site's
            data removes them.
          </li>
          <li>
            <strong className="text-[var(--ink)]">No account needed.</strong> Every calculator works
            without signing in, and signing in doesn't upload anything.
          </li>
          <li>
            Page-view counts: the app loads FreeAppStore's store analytics script
            (api.freeappstore.online/v1/analytics.js), which records which screen you opened (for
            example /tip), the page that linked here, and the time. It's sent to FreeAppStore without
            cookies and without your account, and held in this browser while you're offline. Your
            inputs and results are never included.
          </li>
          <li>
            Everyday Calculators is served via FreeAppStore, which also loads Cloudflare Web Analytics
            (beacon.min.js from static.cloudflareinsights.com). It doesn't use cookies and reports only
            aggregate page-view statistics, such as page load times and visit counts. As with any
            website, the servers handling these requests see your IP address and browser type.
          </li>
          <li>
            No ads, no tracking cookies and no advertising or tracking SDKs. The only third-party
            script is the Cloudflare Web Analytics beacon above.
          </li>
        </ul>
      </section>
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
