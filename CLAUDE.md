# quickcalc

Everyday Calculators: tip and split, percent, discount, age and date, and fuel calculators on
FreeAppStore. Pure client-side maths, offline and private. All five tools are built
(`web/src/calculators/`; pure maths in `*.ts`, UI in `*Tool.tsx`). See freeappstore-online/platform#185.

- Live: https://quickcalc.freeappstore.online
- Dev: `pnpm install && pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test` (vitest, `web/src/**/*.test.ts`)
- E2E: `pnpm e2e` (builds, then Playwright in `e2e/`: each tool, reload persistence, offline, privacy)
- Check: `fas check`; layout: `pnpm build && fas screencheck --skip-build` (the page never scrolls; screens scroll inside `.qc-page`)
- Deploy: `git push origin main` (auto-deploys to R2 via GitHub Actions)

## Notes

- Fonts are self-hosted (`@fontsource-variable/*`); the app makes no third-party requests
  beyond the platform API and analytics loader. Keep it that way.

Platform conventions: https://raw.githubusercontent.com/freeappstore-online/freeappstore/main/SKILLS.md
