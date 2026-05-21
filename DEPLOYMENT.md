# Deployment

Production host: Cloudflare Pages

- Project: `jothi2026`
- Live domain: https://jothi.uk/
- Preview: https://jothi2026.pages.dev
- Branch: `main`
- Framework preset: None / static site
- Build command: empty
- Build output directory: repository root
- Deployment is dashboard-managed in Cloudflare Pages.
- No `wrangler.toml`, `cloudflare.json`, Worker script, GitHub Action, or Cloudflare config file is expected.
- Rollbacks should use Git history and Cloudflare Pages deployment history.
