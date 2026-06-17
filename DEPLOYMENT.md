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

## Parent Advice build step

The Parent Advice generator has been migrated into the repo as a pilot, but Cloudflare Pages settings are not changed in this step.

Required Cloudflare build command after migration approval: `npm run build`

Output directory: repository root

The build reads Markdown files from `content/parent-advice/**/*.md`, writes generated static HTML under `/parent-advice/`, and keeps noindex Parent Advice pages out of `sitemap.xml`.
