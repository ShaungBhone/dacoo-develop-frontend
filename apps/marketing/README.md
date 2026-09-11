# Dacoo marketing

The public Dacoo marketing site. This application is part of the Dacoo frontend Bun workspace.

## Getting Started

Install dependencies from the repository root, then run the marketing development server:

```bash
bun install
bun run dev:marketing
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

Copy `apps/marketing/.env.example` to `apps/marketing/.env.local` and configure the database and Telegram settings before exercising the contact or feedback forms.

## Verification

From the repository root, run `bun run lint:marketing`, `bun run typecheck:marketing`, and `bun run build:marketing`.
