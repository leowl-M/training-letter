// ── RENDER WORLD ──────────────────────────────────────────────────
// _off : white letters on transparent bg — shape-only, color-independent.
// _col : globalColorVal clipped to letter shapes via destination-in.
// Color change = instant (just update globalColorVal, no rebuild).
// _groupSnaps: per-group mini-canvases — front removal = N drawImage calls (GPU only).

let _off    = null;
let _offCtx = null;
let _col    = null;
let _colCtx = null;

let _offGroupCount = 0;
let _offDirty      = true;
let _rebuildQueue  = null;
let _groupSnaps    = [];  // { canvas, x, y } — one per placedGroup, in sync

function invalidateSnapshot() {
  _offDirty = true;
  _rebuildQueue = null;
  _offGroupCount = 0;
  _groupSnaps = [];
  if (_offCtx && _off) _offCtx.clearRect(0, 0, _off.width, _off.height);
}

function markNewGroup() {
  _offDirty = true;
}

// Remove first group instantly: shift snap, reconstruct _off from remaining snaps (GPU).
function removeFirstGroup() {
  if (!_off || _groupSnaps.length === 0 || _rebuildQueue) {
    invalidateSnapshot();
    return;
  }
  _groupSnaps.shift();
  _offGroupCount = Math.max(0, _offGroupCount - 1);
  _reconstructOffFromSnaps();
  _offDirty = true; // incremental path will add the new group at end
}

function _ensureCanvases() {
  if (!_off) {
    _off    = document.createElement('canvas');
    _offCtx = _off.getContext('2d');
    _col    = document.createElement('canvas');
    _colCtx = _col.getContext('2d');
  }
  if (_off.width !== width || _off.height !== height) {
    _off.width  = width;  _off.height  = height;
    _col.width  = width;  _col.height  = height;
    _offCtx.clearRect(0, 0, width, height);
    _offGroupCount = 0; _offDirty = true; _rebuildQueue = null;
    _groupSnaps = [];
  }
}

function _groupBounds(g) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const item of g.items) {
    const pad = item.size * Math.max(item.sx || 1, item.sy || 1) * 1.5;
    minX = Math.min(minX, item.x - pad);
    minY = Math.min(minY, item.y - pad);
    maxX = Math.max(maxX, item.x + pad);
    maxY = Math.max(maxY, item.y + pad);
  }
  minX = Math.max(0, Math.floor(minX));
  minY = Math.max(0, Math.floor(minY));
  maxX = Math.min(_off.width,  Math.ceil(maxX));
  maxY = Math.min(_off.height, Math.ceil(maxY));
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

// Copy bounding-box region from p5 canvas (after rendering group white) into a mini-canvas.
function _captureGroupSnap(g) {
  const b = _groupBounds(g);
  const snap = document.createElement('canvas');
  snap.width = b.w; snap.height = b.h;
  snap.getContext('2d').drawImage(drawingContext.canvas, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
  return { canvas: snap, x: b.x, y: b.y };
}

// Reconstruct _off from all snaps — pure GPU drawImage, no p5 rendering.
function _reconstructOffFromSnaps() {
  _offCtx.clearRect(0, 0, _off.width, _off.height);
  for (const s of _groupSnaps) _offCtx.drawImage(s.canvas, s.x, s.y);
}

function _drawGroupWhite(g) {
  for (let p of g.items) {
    push();
    translate(p.x, p.y); rotate(radians(p.rot)); scale(p.sx, p.sy);
    if (p.font) textFont(p.font);
    drawLetter(p.char, '#FFFFFF', p.effectIdx, p.weight, p.size, p.effectA, p.effectB, p.font, p.fontIdx, p.axes);
    pop();
  }
}

// Build color layer: instant — GPU fillRect + destination-in, ~0.5ms.
function _buildColorLayer() {
  _colCtx.clearRect(0, 0, _col.width, _col.height);
  _colCtx.globalCompositeOperation = 'source-over';
  _colCtx.fillStyle = globalColorVal;
  _colCtx.fillRect(0, 0, _col.width, _col.height);
  _colCtx.globalCompositeOperation = 'destination-in';
  _colCtx.drawImage(_off, 0, 0);
  _colCtx.globalCompositeOperation = 'source-over';
}

function renderWorld(isExporting) {
  if (isExporting) {
    background(palette[bgColorIdx]);
    blendMode(BLEND);
    for (let g of placedGroups) {
      for (let p of g.items) {
        push();
        translate(p.x, p.y); rotate(radians(p.rot)); scale(p.sx, p.sy);
        if (p.font) textFont(p.font);
        drawLetter(p.char, p.colorVal, p.effectIdx, p.weight, p.size, p.effectA, p.effectB, p.font, p.fontIdx, p.axes);
        pop();
      }
    }
    return;
  }

  _ensureCanvases();

  // ── Shape offscreen maintenance ───────────────────────────────────
  if (placedGroups.length === 0) {
    _offCtx.clearRect(0, 0, _off.width, _off.height);
    _offGroupCount = 0; _offDirty = false; _rebuildQueue = null;
    _groupSnaps = [];

  } else if (_offDirty && !_rebuildQueue) {
    if (placedGroups.length > _offGroupCount) {
      // Incremental: render each new group alone, capture snap, composite onto _off.
      for (let gi = _offGroupCount; gi < placedGroups.length; gi++) {
        clear(); blendMode(BLEND);
        _drawGroupWhite(placedGroups[gi]);
        const snap = _captureGroupSnap(placedGroups[gi]);
        _groupSnaps.push(snap);
        _offCtx.drawImage(snap.canvas, snap.x, snap.y);
      }
      _offGroupCount = placedGroups.length;
      _offDirty = false;
    } else {
      // Full rebuild needed (undo, resize, clearAll)
      _offCtx.clearRect(0, 0, _off.width, _off.height);
      _groupSnaps = [];
      _rebuildQueue = placedGroups.slice();
    }

  } else if (_rebuildQueue && _rebuildQueue.length > 0) {
    // Progressive rebuild: one group per frame, captures snap each time.
    clear(); blendMode(BLEND);
    const g = _rebuildQueue.shift();
    _drawGroupWhite(g);
    const snap = _captureGroupSnap(g);
    _groupSnaps.push(snap);
    _offCtx.drawImage(snap.canvas, snap.x, snap.y);
    _offGroupCount++;
    if (_rebuildQueue.length === 0) { _rebuildQueue = null; _offDirty = false; }
  }

  // ── Color layer: globalColorVal clipped to letter shapes ─────────
  if (_offGroupCount > 0) _buildColorLayer();

  // ── Display frame ────────────────────────────────────────────────
  background(palette[bgColorIdx]);
  blendMode(BLEND);
  if (_offGroupCount > 0) drawingContext.drawImage(_col, 0, 0);

  // Cursors drawn last — explicit source-over to guarantee visibility
  drawingContext.globalCompositeOperation = 'source-over';
  for (let i = 0; i < players.length; i++) {
    if (players[i].active) drawWireframeCursor(i);
  }
}
