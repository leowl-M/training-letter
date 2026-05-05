// ── CURSOR / PREVIEW ──────────────────────────────────────────────
function drawWireframeCursor(pId) {
  let p = players[pId];
  let textToDrop = p.selectedChar;
  let spacing    = p.size * 0.6 * p.sx;
  let startX     = -(textToDrop.length - 1) * spacing / 2;

  push();
  translate(p.x, p.y);
  
  // Preview uses current player state, no animations
  rotate(radians(p.rot));
  scale(p.sx, p.sy);
  if (fonts[p.fontIdx]) textFont(fonts[p.fontIdx]);
  for (let i = 0; i < textToDrop.length; i++) {
    push();
    translate(startX + i * spacing, 0);
    drawLetter(textToDrop[i], globalColorVal, p.effectIdx,
               p.weight, p.size, p.effectA, p.effectB, fonts[p.fontIdx]);
    pop();
  }
  pop();

  push(); 
  fill(globalColorVal); noStroke(); 
  textSize(12); textAlign(CENTER, BOTTOM);
  text("P" + (pId + 1), p.x, p.y - p.size/2 - 10);
  pop();

  if (p.snapGrid) {
    push(); stroke(255, 20); strokeWeight(1);
    line(p.x, 0, p.x, height);
    line(0, p.y, width, p.y);
    pop();
  }
}
