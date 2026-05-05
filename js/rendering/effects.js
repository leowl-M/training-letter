// ── RENDER LETTERA ────────────────────────────────────────────────
function drawLetter(charStr, colorVal, effectIdx, weight, size, effectA, effectB, fontObj) {
  if (effectA === undefined) effectA = 0.5;
  if (effectB === undefined) effectB = 0.5;
  
  // Se non c'è il font, facciamo un fallback solido
  if (!fontObj && effectIdx > 0) effectIdx = 0;

  textSize(size);
  textAlign(CENTER, CENTER);
  fill(colorVal);
  noStroke();

  if (effectIdx === 1) {
    // ── MODULI: PUNTI
    let density = map(effectA, 0, 1, 0.05, 0.5);
    let pts = fontObj.textToPoints(charStr, 0, 0, size, { sampleFactor: density });
    let maxDot = map(effectB, 0, 1, 2, 30);
    
    for (let p of pts) {
      let pulse = sin(millis() * 0.005 + p.x * 0.01) * 0.5 + 0.5;
      let d = map(pulse, 0, 1, 1, maxDot);
      circle(p.x, p.y, d);
    }

  } else if (effectIdx === 2) {
    // ── MODULI: GEOMETRIA
    let density = map(effectA, 0, 1, 0.05, 0.3);
    let pts = fontObj.textToPoints(charStr, 0, 0, size, { sampleFactor: density });
    let modSize = map(effectB, 0, 1, 2, 40);
    
    for (let p of pts) {
      push();
      translate(p.x, p.y);
      rotate(millis() * 0.002 + p.x * 0.01);
      rectMode(CENTER);
      // Disegna una croce o un quadrato
      rect(0, 0, modSize, modSize * 0.2);
      rect(0, 0, modSize * 0.2, modSize);
      pop();
    }

  } else if (effectIdx === 3) {
    // ── STROKE: TRATTEGGIO ANIMATO
    let dashLen = map(effectA, 0, 1, 5, 100);
    let speed = map(effectB, 0, 1, 0.1, 5);
    
    noFill();
    stroke(colorVal);
    strokeWeight(weight > 0 ? weight : 2);
    
    // Usiamo il drawingContext per il tratteggio nativo
    drawingContext.setLineDash([dashLen, dashLen * 0.5]);
    drawingContext.lineDashOffset = -millis() * 0.01 * speed;
    
    text(charStr, 0, 0);
    drawingContext.setLineDash([]); // Reset

  } else if (effectIdx === 4) {
    // ── OP-ART: ONDE
    let density = 0.2; // Densità fissa per fluidità
    let pts = fontObj.textToPoints(charStr, 0, 0, size, { sampleFactor: density });
    let freq = map(effectA, 0, 1, 0.01, 0.2);
    let amp = map(effectB, 0, 1, 0, 50);
    
    beginShape();
    for (let p of pts) {
      let wave = sin(millis() * 0.005 + p.y * freq) * amp;
      vertex(p.x + wave, p.y);
    }
    endShape(CLOSE);

  } else {
    // ── SOLIDO
    if (weight > 0) { stroke(colorVal); strokeWeight(weight); }
    text(charStr, 0, 0);
  }
}
