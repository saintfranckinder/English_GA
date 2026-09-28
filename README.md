<p align="center"><img src="logo.svg" alt="English_GA" width="180"></p>

# English_GA

A grammar-only English practice web app. Static files only: no accounts, server, database, or build step.
The product specification is [English_GA-specification-guide.md](English_GA-specification-guide.md).

## Structure

| Path | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js` | Page shell, styling, and all app behavior |
| `sw.js` | Offline cache (works after the first visit) |
| `manifest.webmanifest` | Makes the app installable (name, icons, full-screen mode) |
| `logo.svg`, `icon.svg`, `icon-*.png`, `apple-touch-icon.png` | Full logo, favicon, and installed-app icons |
| `content/*.json` | The 8 runtime question banks (source of truth) |
| `guides/*.md` | Human-readable grammar guides used when writing or reviewing questions |
| `content-source/` | The originally supplied banks, unchanged, kept for reference |
| `tools/convert-legacy-content.py` | Produces `content/` from `content-source/` and holds every recorded, source-verified fix |

Each question's `revision` field records any change made to the supplied wording, with the reason and sources.

## Run locally

Opening `index.html` directly from disk does not work (browsers block loading the JSON files). Serve the folder instead:

```bash
python -m http.server 8765
```

Then open http://localhost:8765. Open http://localhost:8765/#/validate to check every question bank.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select the branch and the `/ (root)` folder, and save.
3. The app appears at `https://<username>.github.io/<repository>/` after a minute or two.

All paths are relative and navigation uses `#/` links, so no server configuration is needed.

## Install on a phone

Open the site, then:

- **Android (Chrome):** tap **Install app** when it appears, or **⋮ → Install app / Add to Home screen**.
- **iPhone (Safari):** tap **Share → Add to Home Screen**.

The installed app opens full-screen with its own icon and works offline after the first visit.

## Progress data

Streaks, daily practice, and scores are saved in the browser's `localStorage` on each device. They are not synced between devices and are lost if the browser's site data is cleared.
