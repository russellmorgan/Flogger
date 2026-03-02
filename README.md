# Flogger

Frogger clone built with Phaser 3.

## Local Development

1. Install dependencies:
   `npm install`
2. Start local dev server:
   `npm run dev`
3. Open the URL shown in the terminal (typically `http://localhost:5173`).

## Build

- Production build: `npm run build`
- Preview build: `npm run preview`

## GitHub Pages

- Auto deploy on push to `main` is configured via:
  `.github/workflows/deploy-pages.yml`
- Manual local deploy (pushes `dist/` to `gh-pages` branch):
  `npm run deploy:pages`

### One-time repository setup

1. In GitHub repository settings, open **Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` and wait for the deploy workflow to finish.
