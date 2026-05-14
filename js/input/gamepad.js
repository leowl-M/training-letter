// ── GAMEPAD ───────────────────────────────────────────────────────
const TOOL_MODES = ['deform', 'effects', 'axes'];

// pairs: [ [axisName, min, max], [axisName, min, max] ]
const AXES_PAIRS = [
  [['wt',-100,100], ['wd',-100,100]],  // Peso   / Larghezza
  [['sl', -60, 60], ['ct',-100,100]],  // Slant  / Contrasto
  [['fl',   0,100], ['rn',   0,100]],  // Flare  / Round
];
const AXES_PAIR_LABELS = ['Peso/Larg', 'Slant/Cont', 'Flare/Round'];

function handleGamepad() {
  let gamepads = navigator.getGamepads();

  // Non-playing states: only handle start / restart
  if (typeof gameState !== 'undefined' && gameState !== 'playing') {
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;
      const pb = (players[i] && players[i].prevButtons) || [];
      for (const btn of [0, 9]) { // ✕ or OPTIONS
        const pressed = gp.buttons[btn] && gp.buttons[btn].pressed;
        if (pressed && !pb[btn]) {
          if (gameState === 'ready') startGame();
          else if (gameState === 'ended') restartGame();
        }
        pb[btn] = pressed;
      }
      if (players[i]) players[i].prevButtons = pb;
    }
    return;
  }

  for (let i = 0; i < gamepads.length && i < MAX_PLAYERS; i++) {
    let gp = gamepads[i];
    if (!gp) continue;

    let p = players[i];
    if (!p) continue;

    p.active = true;

    const deadzone = 0.15;
    const speed    = (logicalW || window.innerWidth) * 0.008;

    // ── Left stick: move ──────────────────────────────────────────
    if (abs(gp.axes[0]) > deadzone) { p.x += gp.axes[0] * speed; needsHudUpdate = true; }
    if (abs(gp.axes[1]) > deadzone) { p.y += gp.axes[1] * speed; needsHudUpdate = true; }
    p.x = constrain(p.x, 0, logicalW);
    p.y = constrain(p.y, 0, logicalH);

    // ── Right stick: depends on toolMode ─────────────────────────
    if (p.toolMode === 'effects') {
      if (abs(gp.axes[2]) > deadzone) { p.effectA = constrain(p.effectA + gp.axes[2] * 0.02, 0, 1); needsHudUpdate = true; }
      if (abs(gp.axes[3]) > deadzone) { p.effectB = constrain(p.effectB + gp.axes[3] * 0.02, 0, 1); needsHudUpdate = true; }

    } else if (p.toolMode === 'deform') {
      if (abs(gp.axes[2]) > deadzone) { p.sx = constrain(p.sx + gp.axes[2] * 0.04, 0.1, 8); needsHudUpdate = true; }
      if (abs(gp.axes[3]) > deadzone) { p.sy = constrain(p.sy + gp.axes[3] * 0.04, 0.1, 8); needsHudUpdate = true; }

    } else if (p.toolMode === 'axes') {
      const pair = AXES_PAIRS[p.axesPairIdx % AXES_PAIRS.length];
      if (abs(gp.axes[2]) > deadzone) {
        const [ax, mn, mx] = pair[0];
        p.axes[ax] = constrain(p.axes[ax] + gp.axes[2] * 3, mn, mx);
        needsHudUpdate = true;
      }
      if (abs(gp.axes[3]) > deadzone) {
        const [ax, mn, mx] = pair[1];
        p.axes[ax] = constrain(p.axes[ax] + gp.axes[3] * 3, mn, mx);
        needsHudUpdate = true;
      }
    }

    // ── L2 / R2: rotate ──────────────────────────────────────────
    if (gp.buttons[6] && gp.buttons[6].value > 0.1) { p.rot -= gp.buttons[6].value * 5; needsHudUpdate = true; }
    if (gp.buttons[7] && gp.buttons[7].value > 0.1) { p.rot += gp.buttons[7].value * 5; needsHudUpdate = true; }

    // ── Digital buttons ───────────────────────────────────────────
    for (let b = 0; b < gp.buttons.length; b++) {
      let pressed = gp.buttons[b].pressed;
      if (pressed && !p.prevButtons[b]) { onGamepadButtonDown(i, b); needsHudUpdate = true; }
      p.prevButtons[b] = pressed;
    }
  }

  if (needsHudUpdate) { updateHUD(); needsHudUpdate = false; }
}

function onGamepadButtonDown(pId, btn) {
  let p = players[pId];
  switch (btn) {

    case 0: placeWord(pId); sfxPlace(); break;                         // ✕  Piazza

    case 1: {                                                          // ○  Chiudi modale o Annulla
      const modal = document.getElementById('email-modal');
      if (modal && !modal.classList.contains('hidden')) closeEmailModal();
      else { undoLast(pId); sfxUndo(); }
      break;
    }

    case 2: {                                                          // □  Colori random
      let bi = Math.floor(Math.random() * palette.length);
      let ti; do { ti = Math.floor(Math.random() * palette.length); } while (ti === bi);
      bgColorIdx = bi;
      globalColorVal = palette[ti];
      for (let g of placedGroups) for (let item of g.items) item.colorVal = globalColorVal;
      let cp = document.getElementById('colorPicker');
      if (cp) cp.value = globalColorVal;
      const tf = document.getElementById('timer-fill');
      if (tf) tf.style.background = globalColorVal;
      sfxColor();
      toast('Colori aggiornati');
      break;
    }

    case 3:                                                            // △  Cicla effetto
      p.effectIdx = (p.effectIdx + 1) % effects.length;
      sfxEffect();
      toast('P' + (pId+1) + ' ' + effects[p.effectIdx]);
      break;

    case 4:                                                            // L1  Lettera prec
      p.charIdx = (p.charIdx - 1 + chars.length) % chars.length;
      p.selectedChar = chars[p.charIdx];
      if (pId === 0) document.getElementById('wordInput').value = p.selectedChar;
      break;

    case 5:                                                            // R1  Lettera succ
      p.charIdx = (p.charIdx + 1) % chars.length;
      p.selectedChar = chars[p.charIdx];
      if (pId === 0) document.getElementById('wordInput').value = p.selectedChar;
      break;

    case 8: {                                                          // SELECT  Reset assi
      p.axes = {wt:0,wd:0,sl:0,ct:0,fl:0,rn:0};
      toast('P' + (pId+1) + ' Assi reset');
      break;
    }

    case 9: openEmailModal(); break;                                    // OPTIONS  Invia Email

    case 10:                                                           // L3  Cicla font
      p.fontIdx = (p.fontIdx + 1) % fontNames.length;
      sfxFont();
      toast('P' + (pId+1) + ' Font: ' + fontNames[p.fontIdx]);
      break;

    case 11: {                                                         // R3  Cicla tool mode
      const idx = (TOOL_MODES.indexOf(p.toolMode) + 1) % TOOL_MODES.length;
      p.toolMode = TOOL_MODES[idx];
      sfxMode();
      toast('P' + (pId+1) + ' Tool: ' + p.toolMode.toUpperCase());
      break;
    }

    case 12: p.size = constrain(p.size + 10, 10, 1000); sfxSize(true);  break; // D-↑  Size+
    case 13: p.size = constrain(p.size - 10, 10, 1000); sfxSize(false); break; // D-↓  Size-

    case 14: {                                                         // D-←  Coppia assi prec
      p.axesPairIdx = (p.axesPairIdx - 1 + AXES_PAIRS.length) % AXES_PAIRS.length;
      sfxAxes();
      toast('P' + (pId+1) + ' Assi: ' + AXES_PAIR_LABELS[p.axesPairIdx]);
      break;
    }
    case 15: {                                                         // D-→  Coppia assi succ
      p.axesPairIdx = (p.axesPairIdx + 1) % AXES_PAIRS.length;
      sfxAxes();
      toast('P' + (pId+1) + ' Assi: ' + AXES_PAIR_LABELS[p.axesPairIdx]);
      break;
    }
  }
}

function updateColorFromPicker(hexString) {
  globalColorVal = hexString;
}
