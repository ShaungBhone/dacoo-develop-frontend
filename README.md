# Dacoo frontend

This Bun workspace contains the Dacoo customer dashboard and authenticated customer guide.

## Applications

- `apps/dashboard` — customer application
- `apps/docs` — bilingual documentation site for `docs.dacoo.co`
- `packages/ui` — shared brand and UI primitives

Run `bun run dev:dashboard` and `bun run dev:docs` in separate terminals. The docs app defaults to port 3001.

## Environment

The root `.env.example` is the complete variable reference. Copy each app's scoped example to `apps/dashboard/.env.local` or `apps/docs/.env.local` and configure the Laravel API URL. The backend must also set `DOCS_URL` to the public docs origin.

## Vercel

Create two projects from this repository with root directories `apps/dashboard` and `apps/docs`. Assign `docs.dacoo.co` to the docs project and configure the environment variables from each app's example file.

## Verification

Use `bun run typecheck`, `bun run test`, and the workspace-specific lint or build commands from the root package.

The Playwright suite uses Bun-installed dependencies but must run under Node.js because Playwright does not support Bun as its test runtime. Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`, then run `bun run test:e2e` after configuring the two local app environments for `dashboard.localhost:3000` and `docs.localhost:3001`.
