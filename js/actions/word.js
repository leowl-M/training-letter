// ── PLACE WORD ────────────────────────────────────────────────────
function placeWord(pId) {
  let p = players[pId];
  let textToDrop   = p.selectedChar;
  let letterSpacing = p.size * 0.6 * p.sx;

  // Create ONE group for the entire word
  let patternGroup = { items: [], playerId: pId };

  let startX   = p.x - (textToDrop.length - 1) * letterSpacing / 2;

  for (let i = 0; i < textToDrop.length; i++) {
    let bx = startX + i * letterSpacing;
    let by = p.y;

    patternGroup.items.push({
      char: textToDrop[i],
      x: bx, y: by,
      font: fonts[p.fontIdx],
      fontIdx: p.fontIdx,
      colorVal: globalColorVal,
      size: p.size, weight: p.weight,
      rot: p.rot, sx: p.sx, sy: p.sy,
      animIdx: p.animIdx,
      effectIdx: p.effectIdx,
      effectA: p.effectA, effectB: p.effectB,
      axes: {...p.axes},
      placedTime: millis()
    });
  }
  
  const MAX_GROUPS = 50;
  placedGroups.push(patternGroup);
  p.history.push(patternGroup);

  if (placedGroups.length > MAX_GROUPS) {
    const removed = placedGroups.shift();
    for (let pl of players) {
      const hi = pl.history.indexOf(removed);
      if (hi !== -1) pl.history.splice(hi, 1);
    }
    removeFirstGroup(); // instant: shifts snap, reconstructs _off from remaining snaps (GPU only)
  } else {
    markNewGroup(); // incremental — no rebuild
  }

  toast(`P${pId+1} Testo piazzato!`);
}

function undoLast(pId) {
  let p = players[pId];
  if (p.history.length > 0) {
    let groupToRemove = p.history.pop();
    // Remove from global placedGroups
    let idx = placedGroups.indexOf(groupToRemove);
    if (idx !== -1) placedGroups.splice(idx, 1);
    invalidateSnapshot();
    toast(`P${pId+1} Undo`);
  }
}
