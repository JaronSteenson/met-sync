# Metlink Quick Stops

Small static PWA for checking five favourite Wellington Metlink stops on a phone.

Register for a Metlink Open Data API token at https://opendata.metlink.org.nz/apis and enter it on the app's Settings page.

## File structure

- `index.html`: main stop board
- `settings.html`: API key and stop settings form
- `styles.css`: shared mobile-first dark styling
- `app.js`: main page loading, fetch, rendering, and service worker registration
- `settings.js`: settings page localStorage logic and service worker registration
- `manifest.json`: PWA manifest
- `sw.js`: basic app shell cache for faster reopening
- `icons/icon-192.svg`: placeholder app icon for 192x192
- `icons/icon-512.svg`: placeholder app icon for 512x512
- `icons/icon-maskable.svg`: placeholder maskable icon for 512x512

## Use

1. Open `settings.html`.
2. Paste your Metlink API key.
3. Enter up to five stop names and stop IDs.
4. Tap `Save`.
5. Open `index.html` and tap `Refresh` if needed.

Saved values live in `localStorage` using these keys:

- `metlinkApiKey`
- `metlinkStopName1` to `metlinkStopName5`
- `metlinkStopId1` to `metlinkStopId5`

## Deploy to GitHub Pages

1. Copy all files in this folder into a GitHub repository.
2. Commit and push to the `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Set the source to `GitHub Actions`.
5. Push again if needed, then wait for the `Deploy static site to GitHub Pages` workflow to finish.
6. Visit the published site URL and open `settings.html` to add your API key and stops.

Extra Pages files included:

- `.github/workflows/deploy.yml`: deploys this static site to GitHub Pages
- `.nojekyll`: prevents Jekyll processing on GitHub Pages

## Icons

The `icons/*.svg` files are simple placeholders so the PWA is installable immediately.

Replace them later with your own icons if you want:

- `icons/icon-192.svg` should be replaced by a 192x192 app icon
- `icons/icon-512.svg` should be replaced by a 512x512 app icon
- `icons/icon-maskable.svg` should be replaced by a 512x512 maskable icon

If you switch to PNG icons, update the filenames and MIME types in `manifest.json`, plus the icon links in `index.html` and `settings.html`.
