// ── RENDER WORLD ──────────────────────────────────────────────────
function renderWorld(isExporting) {
  background(palette[bgColorIdx]);
  
  // No more blend modes, keep it pure
  blendMode(BLEND);

  for (let g of placedGroups) {
    for (let p of g.items) {
      push();
      let px = p.x, py = p.y, prot = p.rot;
      translate(px, py);
      
      // Removed animation logic (Pulse/Spin)
      rotate(radians(prot));
      scale(p.sx, p.sy);
      if (p.font) textFont(p.font);
      drawLetter(p.char, p.colorVal, p.effectIdx, p.weight, p.size, p.effectA, p.effectB, p.font, p.fontIdx, p.axes);
      pop();
    }
  }

  if (!isExporting) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].active) drawWireframeCursor(i);
    }
  }
}
