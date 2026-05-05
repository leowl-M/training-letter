// ── HUD ───────────────────────────────────────────────────────────
function updateHUD() {
  const set = (id, val) => { let el = document.getElementById(id); if (el) el.textContent = val; };

  // Find primary player (first active one)
  let p = players.find(player => player.active) || players[0];

  let currentFontName = fontNames[p.fontIdx] || 'PPFrama Regular';
  set('hud-font',   currentFontName);
  set('hud-effect', effects[p.effectIdx]);
  set('hud-size',   p.size);
  set('hud-weight', p.weight);
  set('hud-rot',    Math.round(p.rot) + '°');
  set('hud-sx',     p.sx.toFixed(2));
  set('hud-sy',     p.sy.toFixed(2));
  set('hud-count',  placedGroups.length);
  set('hud-bg',     palette[bgColorIdx].toUpperCase());
  set('hud-color',  globalColorVal.toUpperCase());

  // Multi-player status summary
  let statusStr = players
    .filter(pl => pl.active)
    .map((pl, i) => `P${i+1}: ${pl.selectedChar} [${pl.toolMode.toUpperCase()}]`)
    .join('  |  ');
  set('hud-deform', statusStr || 'In attesa di controller...');
}
