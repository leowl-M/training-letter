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
      colorVal: globalColorVal,
      size: p.size, weight: p.weight,
      rot: p.rot, sx: p.sx, sy: p.sy,
      animIdx: p.animIdx,
      effectIdx: p.effectIdx,
      effectA: p.effectA, effectB: p.effectB,
      placedTime: millis()
    });
  }
  
  placedGroups.push(patternGroup);
  p.history.push(patternGroup);

  toast(`P${pId+1} Testo piazzato!`);
}

function undoLast(pId) {
  let p = players[pId];
  if (p.history.length > 0) {
    let groupToRemove = p.history.pop();
    // Remove from global placedGroups
    let idx = placedGroups.indexOf(groupToRemove);
    if (idx !== -1) placedGroups.splice(idx, 1);
    
    toast(`P${pId+1} Undo`);
  }
}
