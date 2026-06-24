# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Nepal Seismic" — an SSR React content site about earthquake awareness and preparedness for Nepal. Static-ish marketing/educational pages (home, historical case studies, preparedness, about) plus an interactive preparedness quiz. There is no backend database or API; all content data lives in-repo (`src/data/`, inline arrays in route files).

## Stack

- **TanStack Start** (SSR framework on TanStack Router) + **React 19**
- **Vite 8** build, configured through `@lovable.dev/vite-tanstack-config`
- **Tailwind CSS v4** + **shadcn/ui** (new-york style, components in `src/components/ui/`)
- **TanStack Query** provided at the root (no server data fetching is wired up yet)
- **Bun** is the package manager (`bun.lock`, `bunfig.toml`)

## Commands

```bash
bun install          # install deps
bun run dev          # vite dev server
bun run build        # production build (nitro, cloudflare target by default)
bun run preview      # preview the production build
bun run lint         # eslint .
bun run format       # prettier --write .
```

There is no test suite or test runner configured.

## Architecture notes

**Build config is wrapped, not raw Vite.** `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already bundles tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, the `@` path alias, React/TanStack dedupe, and dev-only plugins. Do **not** re-add these plugins manually or the app breaks with duplicates. Pass extra config via the wrapper's `defineConfig({ vite: { ... } })`.

**Custom SSR error handling — three layers.** TanStack Start's server entry is redirected to `src/server.ts` (via `tanstackStart.server.entry`). The flow:
- `src/start.ts` — request middleware that catches thrown errors and renders `error-page.ts`.
- `src/server.ts` — wraps the server entry and calls `normalizeCatastrophicSsrResponse`, because **h3 swallows in-handler throws into a generic JSON 500** (`{"unhandled":true,"message":"HTTPError"}`) that a try/catch never sees. It detects that body and re-renders a proper error page.
- `src/lib/error-capture.ts` — records the last real Error out-of-band (global `error`/`unhandledrejection` listeners, 5s TTL) so `server.ts` can recover the original stack after h3 has discarded it.

When touching SSR error behavior, keep these three files consistent.

**Routing is file-based (TanStack Start).** See `src/routes/README.md` for conventions. Key points: every `.tsx` in `src/routes/` is a route; `__root.tsx` is the only app shell (defines `<html>`, head meta, theme init script, error/404 boundaries, providers); `routeTree.gen.ts` is auto-generated — never edit by hand. Do not introduce Next.js/Remix conventions (`src/pages/`, `app/layout.tsx`).

**Page composition.** Route components wrap their content in `<Layout>` (`src/components/site/Layout.tsx`), which provides AlertBanner, Header, Footer, EmergencyButton, and BackToTop. Site-specific presentational components live in `src/components/site/`; generic primitives in `src/components/ui/`.

**Theming.** Dark/light/system theme via `ThemeProvider` (`src/components/site/`), persisted in `localStorage` under key `nepal-seismic-theme`. An inline `themeInitScript` in `__root.tsx` applies the theme before hydration to avoid flash — keep the storage key in sync between the script and the provider.

**Charts** use `recharts` with CSS-variable colors (`var(--color-chart-N)`); chart data is defined inline in the route files (e.g. `src/routes/index.tsx`).

## Conventions

- Path alias `@/*` → `src/*`.
- Prettier: 100 col, semicolons, double quotes, trailing commas (`all`).
- `@typescript-eslint/no-unused-vars` is off; `react-hooks` rules are on.
- Importing `server-only` is an eslint error — use `*.server.ts` or `@tanstack/react-start/server-only` instead.

## Lovable integration (important)

This project is connected to [Lovable](https://lovable.dev) and syncs via git (`.lovable/`, `AGENTS.md`). **Do not rewrite published git history** (no force-push, rebase, amend, or squash of pushed commits) — it corrupts the user's Lovable project history. Commits pushed to the connected branch sync back to Lovable, so keep the branch in a working state.

`bunfig.toml` enforces a 24h supply-chain guard (`minimumReleaseAge`) skipping packages published less than a day ago; only `@lovable.dev/*` packages are excepted. Confirm with the user before adding any exception.
