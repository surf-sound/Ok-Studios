# OK Studios Website

The live website for OK Studios — a small web design studio for local businesses.

## Structure

Plain HTML/CSS/JS, no build step, no dependencies.

```
index.html      → main page
styles.css      → all styling
script.js       → interactivity (sliders, animations, modal, form)
*.svg           → before/after portfolio mockups
```

## Local preview

Just open `index.html` in a browser — no server required.

If you want a local dev server (recommended for testing before pushing):
```
npx wrangler pages dev .
```

## Deploying

This repo is connected to Cloudflare Pages. Pushing to `main` deploys automatically.

Manual deploy (if ever needed):
```
npx wrangler pages deploy .
```
