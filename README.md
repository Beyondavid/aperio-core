# Aperio

Independent, plain-English reports on how cities are doing, built from their own public records.

- `data/`: the figures behind each report, as CSV, with their source named on the report page.
- `build.mjs`: turns the data into static pages in `public/`. No dependencies; it fails if a figure stops matching a claim on the page.
- `src/styles.css`: house style. Read `DESIGN.md` first.

```bash
npm run build
```

Deploys as a static site: Vercel runs `npm run build` and serves `public/`.
