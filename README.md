# Everyday Calculators

**Coming soon — tip and split, percent, discount, age and date, and fuel calculators. Private and
offline.** A free app on [FreeAppStore](https://freeappstore.online), live at
https://quickcalc.freeappstore.online.

Right now this is a shell: it lists the planned tools, but none of them calculate anything yet.
Progress is tracked in
[freeappstore-online/platform#185](https://github.com/freeappstore-online/platform/issues/185).

## Develop

```bash
pnpm install
pnpm dev      # local dev server
pnpm build    # production build in web/dist
fas check     # FreeAppStore compliance checks
```

Pushes to `main` auto-deploy via GitHub Actions.

## License

MIT.
