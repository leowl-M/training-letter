// ── CANVAS ACTIONS ────────────────────────────────────────────────
function clearAll() {
  placedGroups = [];
  players.forEach(p => p.history = []);
  invalidateSnapshot();
  toast('Canvas svuotato');
}

function fitCanvas() {
  const wrap = document.getElementById('canvasWrap');
  if (!wrap || !wrap.parentElement) return;
  const main = wrap.parentElement;
  const w = main.clientWidth, h = main.clientHeight;
  if (w === logicalW && h === logicalH) return;
  logicalW = w; logicalH = h;
  resizeCanvas(logicalW, logicalH);
  invalidateSnapshot();
  players.forEach(p => {
    p.x = constrain(p.x, 0, logicalW);
    p.y = constrain(p.y, 0, logicalH);
  });
}
