# MT Forensic Psychiatric Law — PWA

Offline-capable Android homescreen app covering Montana MCA Title 46, Chapter 14 (complete, 2025 session) and ARM 37.106.16/19/3.

## Repository structure

```
/
├── index.html      ← Full app (React/Babel inline, all content embedded)
├── manifest.json   ← PWA manifest (homescreen install)
├── sw.js           ← Service worker (offline cache + update detection)
├── version.json    ← Version file (the only file you edit to push an update)
└── README.md
```

---

## Setup: GitHub Pages hosting

1. Create a new GitHub repository (public or private — Pages works on both with the right plan).
2. Upload all four files (`index.html`, `manifest.json`, `sw.js`, `version.json`) to the repository root.
3. Go to **Settings → Pages**.
4. Under **Source**, select **Deploy from a branch** → branch: `main` → folder: `/ (root)`.
5. Click **Save**. GitHub will provision a URL like `https://yourusername.github.io/repo-name/`.
6. Wait ~60 seconds, then visit that URL in Chrome on Android.

> **HTTPS is required** for service workers and PWA install. GitHub Pages provides this automatically.

---

## Installing to Android homescreen (Chrome)

1. Open Chrome on Android and navigate to the GitHub Pages URL.
2. Wait for the page to fully load (fonts and scripts cache on first visit).
3. Tap the **three-dot menu (⋮)** in the top-right corner of Chrome.
4. Tap **"Add to Home screen"** (or **"Install app"** if Chrome shows the install banner).
5. Confirm the install. The app icon will appear on your homescreen.
6. Launch from the homescreen — it opens in standalone mode (no browser chrome) and works fully offline.

---

## Publishing an update

The app checks `version.json` every time it loads (and every 30 minutes while open). When the version string in `version.json` doesn't match what's embedded in `index.html`, a green update banner appears at the top of the screen with a **"Update now"** button.

### To release an update:

1. Edit `index.html`:
   - Update the `CURRENT_VERSION` constant near the top of the `<script>` block.
   - Make your content changes.

2. Edit `sw.js`:
   - Update `APP_VERSION` at the top to match.

3. Edit `version.json`:
   - Bump `"version"` to match.
   - Update `"date"` and `"notes"`.

4. Commit and push all three files to GitHub.

5. GitHub Pages deploys in ~60 seconds.

6. On next app launch (or within 30 minutes if the app is open), the user will see the update banner and can tap **"Update now"** to reload with the new version.

### Version format

Use semantic versioning: `MAJOR.MINOR.PATCH`
- **PATCH** (1.0.1) — content corrections, typo fixes
- **MINOR** (1.1.0) — new sections, new ARM rules added
- **MAJOR** (2.0.0) — structural changes to the app

---

## Offline behavior

- On first visit, all app assets are cached by the service worker (including Google Fonts after first load).
- Subsequent visits load entirely from cache — no network needed.
- The app works fully offline once cached.
- A gray **"OFFLINE"** badge appears in the bottom-right corner when the device has no network.
- `version.json` is fetched network-first; if offline, the cached version is used (no false update banners).

---

## Updating content without a new release

Content is compiled into `index.html`. There is no separate data file — all statutory text is inline. This is intentional for offline reliability: one file = one cache entry = always works.

---

## Technical notes

- No build step. No Node. No npm. Edit the HTML file directly.
- React 18 + Babel standalone compile JSX in the browser at load time (~300ms on first load, instant from cache).
- The service worker uses a **cache-name versioning** strategy: upgrading `APP_VERSION` in `sw.js` automatically invalidates the old cache on next visit.
- Google Fonts are cached on first successful load. If the device was offline on first visit, the app falls back to `Georgia, serif` / `monospace` system fonts — fully readable.
- Icons are generated via `<canvas>` at runtime — no PNG files to manage.
