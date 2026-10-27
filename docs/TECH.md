# Technical Decisions

Agreed with the owner. Read this together with `VISION.md`.

| Area | Decision | Notes |
|------|----------|-------|
| Frontend | Plain HTML + CSS + JavaScript (ES modules). No framework, no build step, no npm dependencies. | Must run as static files. |
| Rendering | HTML5 `<canvas>` 2D, pixel-perfect scaling (`image-smoothing` off, integer-ish scale). | Pixel art must never look blurry. |
| Layout | **Adaptive.** Wide screen: port view on the left, upgrade panel on the right. Upright phone: port view on top, upgrade panel below. | Mouse and touch both supported. |
| Backend / DB / auth | None. | Adding cloud saves later would be a big change. |
| Saving | Browser `localStorage` autosave. Includes a save version number so saves can be migrated later. | Progress stays on one device. |
| Hosting | GitHub Pages, served from this repo (public). `index.html` at the repo root. | Asset paths must be relative. |
| Art | CraftPix "Free Seaport Tileset 32x32" (owner-supplied) plus original art drawn by Claude (ships, trucks/trains, port variants). | Commit **only the files the game uses**: no PSDs, no zip. Credit CraftPix in `CREDITS.md`. CraftPix forbids redistributing the raw pack on its own. |
| Audio | Web Audio API. Sound effects and music generated in code, or CC0 sources. Separate mute toggles for sound and music. | No copyrighted audio. |
| Fonts | Pixel-style font. Only if its license allows bundling, otherwise a CSS fallback. | The pack's "Future Millennium" font is not bundled. |
