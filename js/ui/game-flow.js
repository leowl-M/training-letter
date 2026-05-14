// ── GAME FLOW ─────────────────────────────────────────────────────
const SESSION_DURATION = 3 * 60 * 1000;

let gameState = 'ready'; // ready | countdown | playing | ended
let sessionStartTime = 0;
let _bgInterval = null;
let _bgIdx = 0;

function _applyStartColors() {
  let ti; do { ti = Math.floor(Math.random() * palette.length); } while (ti === _bgIdx);
  document.getElementById('start-overlay').style.background = palette[_bgIdx];
  document.getElementById('start-title').style.color = palette[ti];
}

function _startBgCycle() {
  _bgIdx = Math.floor(Math.random() * palette.length);
  _applyStartColors();
  _bgInterval = setInterval(() => {
    _bgIdx = (_bgIdx + 1) % palette.length;
    _applyStartColors();
  }, 1400);
}

function _stopBgCycle() {
  clearInterval(_bgInterval);
  _bgInterval = null;
}

function initGameFlow() {
  gameState = 'ready';
  document.getElementById('start-overlay').classList.remove('hidden');
  _startBgCycle();
}

function startGame() {
  if (gameState !== 'ready') return;
  _stopBgCycle();
  gameState = 'countdown';
  document.getElementById('start-overlay').classList.add('hidden');
  document.getElementById('countdown-overlay').classList.remove('hidden');
  _runCountdown(['3', '2', '1', 'GO!'], 0);
}

function _runCountdown(steps, i) {
  const el   = document.getElementById('countdown-number');
  const ov   = document.getElementById('countdown-overlay');

  const bi = Math.floor(Math.random() * palette.length);
  let ti; do { ti = Math.floor(Math.random() * palette.length); } while (ti === bi);
  ov.style.background = palette[bi];

  el.textContent      = steps[i];
  el.style.color      = palette[ti];
  const isGo = steps[i] === 'GO!';
  el.style.fontSize   = isGo ? 'clamp(64px,14vw,120px)' : '32vw';
  el.style.textShadow = 'none';

  el.classList.remove('countdown-pop');
  void el.offsetWidth;
  el.classList.add('countdown-pop');
  if (typeof sfxCountdown === 'function') sfxCountdown(steps[i]);

  const delay = isGo ? 700 : 900;

  if (i < steps.length - 1) {
    setTimeout(() => _runCountdown(steps, i + 1), delay);
  } else {
    setTimeout(() => {
      document.getElementById('countdown-overlay').classList.add('hidden');
      _randomizeColors();
      gameState = 'playing';
      sessionStartTime = performance.now();
      document.getElementById('timer-bar').classList.remove('hidden');
      document.getElementById('no-pad-msg').style.display = 'none';
      if (typeof startMusic === 'function') startMusic();
    }, delay);
  }
}

function _randomizeColors() {
  const bi = Math.floor(Math.random() * palette.length);
  let ti;
  do { ti = Math.floor(Math.random() * palette.length); } while (ti === bi);
  bgColorIdx = bi;
  globalColorVal = palette[ti];
  const cp = document.getElementById('colorPicker');
  if (cp) cp.value = globalColorVal;
  document.getElementById('timer-fill').style.background = globalColorVal;
  needsHudUpdate = true;
}

function updateTimer() {
  if (gameState !== 'playing') return;

  const left = Math.max(0, SESSION_DURATION - (performance.now() - sessionStartTime));
  const fill = document.getElementById('timer-fill');
  fill.style.width      = (left / SESSION_DURATION * 100) + '%';
  fill.style.background = globalColorVal;

  if (left === 0) endGame();
}

function endGame() {
  gameState = 'ended';
  if (typeof stopMusic === 'function') stopMusic();
  if (typeof sfxGameEnd === 'function') sfxGameEnd();
  document.getElementById('timer-bar').classList.add('hidden');
  openEmailModal();
}

function restartGame() {
  clearAll();
  gameState = 'ready';
  document.getElementById('timer-fill').style.width = '100%';
  document.getElementById('start-overlay').classList.remove('hidden');
  _startBgCycle();
}
