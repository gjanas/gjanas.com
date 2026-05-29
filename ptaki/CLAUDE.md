# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A standalone static bird detection dashboard that pulls data from the [Birdweather API](https://birdweather.com). It's embedded in a Jekyll personal site (parent directory) but has zero build steps — just open `index.html` in a browser.

## Project Structure

- `index.html` — Everything UI: HTML structure + embedded CSS (including dark mode via `prefers-color-scheme: dark`)
- `app.js` — All logic: fetches from Birdweather API, renders the "last detection" card, and the "top 10 species" table with 24h/week/month tab switching
- `placeholder.jpg` — Fallback image when no species photo is available

## How to Work With This

- **No build step, no server required.** Open `index.html` directly in a browser.
- **No tests, no linter config.** It's a single-page dashboard, not an app with a toolchain.
- **CSS is inline in index.html.** No separate stylesheet. Dark mode styles live inside `@media (prefers-color-scheme: dark)`.
- **The data comes from a live API.** `app.js` fetches from `birdweather.com` on page load and every 10s. You need internet access for the dashboard to show data.

## Key Architecture Details

- **Birdweather station token** is hardcoded in `app.js` (line 1). The token authenticates reads only — it's the public station ID.
- **API endpoints used:**
  - `/detections?limit=1` — latest single detection (last bird card)
  - `/species?limit=10&since=<ISO-date>` — top species for a time range (the table, filtered by active tab)
- **Tab switching** passes different `since` values: 24h, 7 days, 30 days back. The same `/species` endpoint is reused.
- **Images** link to Polish Wikipedia via `openWikipediaPage()`.
- **The parent directory** (`/Users/gjanas/Downloads/git/gjanas.com/`) is a Jekyll site that links to `gjanas.com/ptaki` in its navbar. The ptaki directory is fully self-contained and unrelated to Jekyll.