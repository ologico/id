# Id by Infinite Logic

This project implements a minimal identity service that binds a WebAuthn credential (your primary identity) to additional identities, such as GitHub. It is designed as a lightweight, local-first identity provider for development or integration into other Infinite Logic applications.

## Getting Started

Clone the repo, copy the example environment file, install dependencies, and start the dev server:

```bash
npm install
npm run dev
```

## Important Note About Astro DB During Development

This project uses Astro DB, which stores your data in the `.astro/` directory. Because this directory is rebuilt when the dev server restarts, you will lose registered users and login state between restarts.

This creates a mismatch:

- Your browser persists your WebAuthn credential in localStorage
- Astro DB resets on each rebuild

The result is that your browser will try to authenticate with a credential that the server no longer recognizes.

## Keeping a Stable WebAuthn Identity in Development

After you register your first user, run:

```bash
npm run generate-seed
```

This updates the file:

```
db/seed.ts
```

with your current identity data. This seed file preloads your WebAuthn credential and linked GitHub identity on each dev server startup.

Your browser keeps its stored credential and Astro DB reloads matching data, making WebAuthn development reliable without having to clear localStorage or re-register each time.

## Wrangler Configuration

`wrangler` is Cloudflare's CLI for managing their environment. The `wrangler.jsonc` file is used both for local development and to configure the runtime that executes the app.

### The Problem

- We need `wrangler.jsonc` locally for sessions to work (Astro has an integration)
- If we deploy with it, it breaks the build environment by overriding environment variables
- This would force us to check secrets into `wrangler.jsonc` to make them work in the build environment

### The Solution

We use `wrangler.local.jsonc` for local development and rely on Cloudflare Pages environment defaults in production.

**For local development, copy the local config:**

```bash
cp wrangler.local.jsonc wrangler.jsonc
```

This keeps secrets out of the deployed configuration while maintaining local functionality.
