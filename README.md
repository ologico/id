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

## Wrangling

`wrangler` is cloudflare's cli for managing their environment. `wrangler.jsonc` is a file format that is both used for local development and to configure the runtime that executes the app. We need it locally for session to run locally (astro has an integration), but if we deploy with it, it breaks the build environment because it overrides env vars that are placed in the file. This means we would need to check secrets into our `wrangle.jsonc` in order to get them to work in the build envronment. To work around all this, we have a `wrangle.local.jsonc` that is meant to be used locally, but we take the defaults from the pages environment in prod, so we do not want it in that location in prod. 

tl;dr
```
cp wrangler.local.jsonc wrangler.jsonc
```
