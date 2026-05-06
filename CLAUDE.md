# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

There is no build step. Open `index.html` directly in a browser, or serve locally to avoid font-loading restrictions:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Architecture

This is a pure client-side browser app. No package manager, no bundler, no framework.

**Dependencies (all via CDN):**
- [p5.js](https://p5js.org/) — canvas rendering loop (`preload`, `setup`, `draw`)
- Tailwind CSS CDN — sidebar UI styling
- Lucide icons CDN — sidebar icons

**Script loading order matters** (defined in `index.html`):

```
config.js → state.js → rendering/* → actions/* → ui/hud.js → input/gamepad.js → sketch.js → ui/events.js
```

### Module responsibilities

| File | Role |
|---|---|
| `js/config.js` | Constants: `chars`, `fontPaths`, `fontNames`, `effects[]`, `palette[]` |
| `js/state.js` | Global mutable state: `players[]`, `placedGroups[]`, `bgColorIdx`, `logicalW/H` |
| `sketch.js` | p5.js entry point: `preload()` loads fonts, `setup()` creates canvas, `draw()` calls `handleGamepad()` + `renderWorld()` |
| `js/rendering/renderer.js` | `renderWorld()` — draws all `placedGroups` and active cursors each frame |
| `js/rendering/effects.js` | `drawLetter()` — dispatches rendering per `effectIdx` (Solid, Points, Geometry, Dashes, Op-Art Waves) |
| `js/rendering/cursor.js` | `drawWireframeCursor()` — live preview of the active player's letter at cursor position |
| `js/actions/word.js` | `placeWord()` / `undoLast()` — add/remove groups from `placedGroups` |
| `js/actions/export.js` | `saveSketch()` (PNG) / `saveGifExport()` (3-second GIF via p5.js) |
| `js/actions/canvas.js` | `clearAll()` / `fitCanvas()` (ResizeObserver handler) |
| `js/ui/hud.js` | `updateHUD()` — syncs sidebar text values from player state |
| `js/ui/events.js` | DOM event bindings; `toast()` utility; sidebar toggle; `colorPicker` input handler |
| `js/input/gamepad.js` | `handleGamepad()` polling loop (called every frame); `onGamepadButtonDown()` button dispatch; `updateColorFromPicker()` callback |

### Key data structures

**`players[i]`** (up to 4, one per gamepad):
- Position: `x`, `y`
- Typography: `selectedChar`, `charIdx`, `fontIdx`, `effectIdx`, `size`, `weight`, `rot`, `sx`, `sy`, `effectA`, `effectB`
- Mode: `toolMode` (`'deform'` | `'effects'`) — right stick controls sx/sy vs effectA/effectB
- `history[]` — stack of placed groups for per-player undo

**`placedGroups[]`** — array of `{ items[], playerId }`. Each `item` is a snapshot of a letter's full render state at the moment it was placed.

**`globalColorVal`** — single shared text color across all players; `bgColorIdx` indexes into `palette[]` for background.

### Effects system

Effects are indexed via `effectIdx` and rendered in `drawLetter()`. Effects 1, 2, and 4 use `p5.Font.textToPoints()` (requires a loaded OTF font). `effectA` and `effectB` are normalised [0,1] parameters controlling per-effect attributes (density, size, speed, etc.).

### Fonts

Three PPFrama OTF files in `font/`. Loaded as p5.Font objects in `preload()` into the `fonts[]` array. `fontNames[]` in `config.js` has only 2 entries while `fontPaths` has 3 — cycling font with L3 uses `fontNames.length` as the modulus, so the third font (BlackItalic) is loaded but not reachable via gamepad cycling.

## Backend

`backend/` is a small Express server deployed on Render as a separate **Web Service** (root directory: `backend/`).

- Single endpoint: `POST /send-email` — accepts `{ email, image }` (image is a `data:image/png;base64,...` string) and sends via Resend
- Required env vars on Render: `RESEND_API_KEY`, `ALLOWED_ORIGIN` (URL of the frontend Static Site)
- Local dev: copy `backend/.env.example` to `backend/.env`, then `cd backend && npm install && npm run dev`

The frontend URL for the backend is set in `js/actions/email.js` via the `BACKEND_URL` constant — update this after the Render Web Service is deployed.
