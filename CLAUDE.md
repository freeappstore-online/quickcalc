# quickcalc

Everyday Calculators: tip and split, percent, discount, age and date, and fuel calculators on
FreeAppStore. Pure client-side maths, offline and private. Currently a "Coming soon" shell
(Calculators, About); see freeappstore-online/platform#185.

- Live: https://quickcalc.freeappstore.online
- Dev: `pnpm install && pnpm dev`
- Build: `pnpm build`
- Check: `fas check`
- Deploy: `git push origin main` (auto-deploys to R2 via GitHub Actions)

## Notes

- Fonts are self-hosted (`@fontsource-variable/*`); the app makes no third-party requests
  beyond the platform API and analytics loader. Keep it that way.

Platform conventions: https://raw.githubusercontent.com/freeappstore-online/freeappstore/main/SKILLS.md
