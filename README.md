# Dacoo frontend

This Bun workspace contains Dacoo's customer-facing web applications.

## Applications

- `apps/dashboard` — customer application
- `apps/docs` — bilingual documentation site for `docs.dacoo.co`
- `apps/marketing` — public marketing site for `dacoo.co`
- `packages/ui` — shared brand and UI primitives

Run `bun run dev:dashboard`, `bun run dev:docs`, and `bun run dev:marketing` in separate terminals. The dashboard uses port 3000, docs uses port 3001, and marketing uses port 3002.

## Environment

Copy each app's scoped example to its local environment file. Dashboard and docs require the Laravel API URL; marketing requires the database and Telegram settings listed in `apps/marketing/.env.example`. The backend must also set `DOCS_URL` to the public docs origin.

## Vercel

Create three projects from this repository with root directories `apps/dashboard`, `apps/docs`, and `apps/marketing`. Assign each domain to its corresponding project and configure the environment variables from each app's example file.

## Verification

Use `bun run typecheck`, `bun run test`, and the workspace-specific lint or build commands from the root package.

The Playwright suite uses Bun-installed dependencies but must run under Node.js because Playwright does not support Bun as its test runtime. Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`, then run `bun run test:e2e` after configuring the two local app environments for `dashboard.localhost:3000` and `docs.localhost:3001`.
