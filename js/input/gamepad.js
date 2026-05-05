// ── GAMEPAD ───────────────────────────────────────────────────────
function handleGamepad() {
  let gamepads = navigator.getGamepads();
  
  for (let i = 0; i < gamepads.length && i < MAX_PLAYERS; i++) {
    let gp = gamepads[i];
    if (!gp) continue;

    let p = players[i];
    if (!p) continue;
    
    p.active = true;

    let deadzone = 0.15;
    let speed    = (logicalW || window.innerWidth) * 0.008;

    if (abs(gp.axes[0]) > deadzone) { p.x += gp.axes[0] * speed; needsHudUpdate = true; }
    if (abs(gp.axes[1]) > deadzone) { p.y += gp.axes[1] * speed; needsHudUpdate = true; }
    p.x = constrain(p.x, 0, logicalW);
    p.y = constrain(p.y, 0, logicalH);
    
    if (p.toolMode === 'effects') {
      if (abs(gp.axes[2]) > deadzone) { p.effectA = constrain(p.effectA + gp.axes[2] * 0.02, 0, 1); needsHudUpdate = true; }
      if (abs(gp.axes[3]) > deadzone) { p.effectB = constrain(p.effectB + gp.axes[3] * 0.02, 0, 1); needsHudUpdate = true; }
    } else if (p.toolMode === 'deform') {
      if (abs(gp.axes[2]) > deadzone) { p.sx = constrain(p.sx + gp.axes[2] * 0.04, 0.1, 8); needsHudUpdate = true; }
      if (abs(gp.axes[3]) > deadzone) { p.sy = constrain(p.sy + gp.axes[3] * 0.04, 0.1, 8); needsHudUpdate = true; }
    }

    if (gp.buttons[6] && gp.buttons[6].value > 0.1) { p.rot -= gp.buttons[6].value * 5; needsHudUpdate = true; }
    if (gp.buttons[7] && gp.buttons[7].value > 0.1) { p.rot += gp.buttons[7].value * 5; needsHudUpdate = true; }

    for (let b = 0; b < gp.buttons.length; b++) {
      let pressed = gp.buttons[b].pressed;
      if (pressed && !p.prevButtons[b]) {
        onGamepadButtonDown(i, b);
        needsHudUpdate = true;
      }
      p.prevButtons[b] = pressed;
    }
  }
  if (needsHudUpdate) {
    updateHUD();
    needsHudUpdate = false;
  }
}

function onGamepadButtonDown(pId, btn) {
  let p = players[pId];
  switch (btn) {
    case 0: placeWord(pId); break;                        // ✕  Piazza

    case 1: undoLast(pId); break;                        // ○  Annulla (per giocatore)

    case 2: {                                          // □  Colori random
      let bi = Math.floor(Math.random() * palette.length);
      let ti; do { ti = Math.floor(Math.random() * palette.length); } while (ti === bi);
      bgColorIdx = bi;
      globalColorVal = palette[ti];
      for (let g of placedGroups)
        for (let item of g.items) item.colorVal = globalColorVal;
      
      let cp = document.getElementById('colorPicker');
      if (cp) cp.value = globalColorVal;
      toast('Colori aggiornati');
      break;
    }

    case 3:                                            // △  Cicla effetto
      p.effectIdx = (p.effectIdx + 1) % effects.length;
      toast('P' + (pId+1) + ' Effetto: ' + effects[p.effectIdx]);
      break;

    case 4:                                            // L1  Lettera prec
      p.charIdx = (p.charIdx - 1 + chars.length) % chars.length;
      p.selectedChar = chars[p.charIdx];
      if (pId === 0) document.getElementById('wordInput').value = p.selectedChar;
      break;

    case 5:                                            // R1  Lettera succ
      p.charIdx = (p.charIdx + 1) % chars.length;
      p.selectedChar = chars[p.charIdx];
      if (pId === 0) document.getElementById('wordInput').value = p.selectedChar;
      break;

    case 6: // L2 (Formerly animation, now unused or for future)
      break;

    case 7: // R2 (Formerly blend mode, now unused or for future)
      break;

    case 8: break; // Share/Select - formerly tile type

    case 9: saveSketch(); break;                       // Options/Start

    case 10:                                           // L3  Cicla font
      p.fontIdx = (p.fontIdx + 1) % fontNames.length;
      toast('P' + (pId+1) + ' Font: ' + fontNames[p.fontIdx]);
      break;

    case 11: {                                         // R3  Cicla tool mode
      p.toolMode = (p.toolMode === 'deform') ? 'effects' : 'deform';
      toast('P' + (pId+1) + ' Tool: ' + p.toolMode.toUpperCase());
      break;
    }

    case 12: p.size = constrain(p.size + 10, 10, 1000); break; // D-Pad Up: Size+
    case 13: p.size = constrain(p.size - 10, 10, 1000); break; // D-Pad Down: Size-
    case 14: break; // D-Pad Left - formerly tile cols-
    case 15: break; // D-Pad Right - formerly tile cols+
  }
}

function updateColorFromPicker(hexString) {
  globalColorVal = hexString;
}
