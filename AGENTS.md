# AGENTS.md

Agent-facing entry point for `gongeo.us-nikki-tracker`. Keep this file limited to rules that apply broadly; load the linked guides only for matching work.

## Working agreements

- Human intent and repo-local files are the source of truth. Inspect the relevant implementation before changing behavior.
- Keep diffs focused. Do not bundle unrelated cleanup with requested work.
- Prefix shell commands with `rtk`; wrap PowerShell cmdlets as `rtk powershell -Command ...`.
- Use npm for dependency installation and package scripts. Do not use pnpm.
- Use MCP tools only when the user explicitly requests them.
- Keep secrets, keys, and tokens in runtime configuration or environment variables.

## Verification and generated files

- Run `npm run lint` after meaningful TypeScript, Vue, or API changes.
- Run `npm run build` only when the user explicitly requests it.
- Add lasting tests for meaningful regression coverage; remove task-only checks after targeted verification.
- Do not manually edit `.nuxt`, `.output`, `dist`, or other generated output.
- Do not rewrite large SQL or data assets unless the task requires it.

## Project baseline

- Nuxt 4, Vue 3, and TypeScript; Nitro targets Netlify.
- UI uses Naive UI, Tailwind 4, global CSS, and Outfit weights 400–700.
- Use auto-imports within each runtime. Nitro does not auto-import `app/` helpers; modules loaded by the server must explicitly import those dependencies or move shared logic into `shared/`. See [server and database rules](docs/agent-guides/server-and-database.md).
- Reuse existing helpers before adding utilities.

## Load guidance by task

- For UI, pages, components, catalog listings, filters, or localization, read `DESIGN.md` and [frontend rules](docs/agent-guides/frontend.md).
- For server endpoints, caching, locale resolution, Supabase, SQL, or database ownership, read [server and database rules](docs/agent-guides/server-and-database.md).
- For banners, outfits, source maps, game versions, or other maintained domain data, read [domain-data rules](docs/agent-guides/domain-data.md).

## Maintaining guidance

- Record only broadly reusable rules here. Put workflow detail in the matching guide.
- Prefer linting, tests, scripts, and typed boundaries when a rule can be enforced mechanically.
