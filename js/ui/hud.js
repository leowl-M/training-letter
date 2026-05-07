// ── HUD ───────────────────────────────────────────────────────────
function updateHUD() {
  const set = (id, val) => { let el = document.getElementById(id); if (el) el.textContent = val; };

  let p = players.find(player => player.active) || players[0];

  set('hud-font',   fontNames[p.fontIdx] || 'PPFrama Regular');
  set('hud-effect', effects[p.effectIdx]);
  set('hud-size',   p.size);
  set('hud-weight', p.weight);
  set('hud-rot',    Math.round(p.rot) + '°');
  set('hud-sx',     p.sx.toFixed(2));
  set('hud-sy',     p.sy.toFixed(2));
  set('hud-count',  placedGroups.length);
  set('hud-bg',     palette[bgColorIdx].toUpperCase());
  set('hud-color',  globalColorVal.toUpperCase());

  // Tool mode + axes context
  let modeStr = p.toolMode.toUpperCase();
  if (p.toolMode === 'axes') {
    modeStr += ' · ' + AXES_PAIR_LABELS[p.axesPairIdx % AXES_PAIR_LABELS.length];
  }
  set('hud-deform', modeStr);

  // Axes values
  const ax = p.axes;
  const axStr = `WT${Math.round(ax.wt)} WD${Math.round(ax.wd)} SL${Math.round(ax.sl)} CT${Math.round(ax.ct)} FL${Math.round(ax.fl)} RN${Math.round(ax.rn)}`;
  set('hud-axes', axStr);
}
