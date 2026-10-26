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
- **The data comes from a live API.** `app.js` polls `birdweather.com` every 30s (paused while the page is hidden). You need internet access for the dashboard to show data.

## Key Architecture Details

- **Public GraphQL API** (`https://app.birdweather.com/graphql`) queried by numeric `STATION_ID` — no token. Never put the Birdweather station token in this repo: it's the BirdNET-Pi upload secret, not a read key.
- **Queries:**
  - `LATEST_QUERY` — `station.detections(first: 1)`, polled every 30s
  - `TOP_QUERY` — `station.topSpecies(limit, period)`; then aliased `sN: detections(first: 1, speciesId)` queries for each species' latest detection, max 3 per request (API limit), sent in parallel
- **Top species are refetched only when the latest detection id changes** or the tab changes. Older in-flight requests are aborted (`AbortController`); the table re-renders only when its data changed.
- **Tabs** map to `period: InputDuration` values in `RANGES`: 24 hours, 7 days, 30 days.
- **Polish names** come from `species.translations(locale: "pl")`, falling back to `commonName` (English).
- **Images** link to Polish Wikipedia by scientific name (pl.wiki redirects Latin names to articles).
- **The parent directory** (`/Users/gjanas/Downloads/git/gjanas.com/`) is a Jekyll site that links to `gjanas.com/ptaki` in its navbar. The ptaki directory is fully self-contained and unrelated to Jekyll.