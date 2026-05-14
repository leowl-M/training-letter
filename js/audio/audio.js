// ── AUDIO ENGINE (Web Audio API, no external files) ───────────────
let _ctx = null;
let _sfxGain, _musicGain;
let _musicPlaying = false;
let _musicTimer = null;

const BPM = 128;
const B   = 60 / BPM; // 1 beat in seconds

// Melody: [freq_hz, beats]  (0 = rest)
const MELODY = [
  [659,0.5],[659,0.5],[784,0.5],[659,0.5],[880,0.5],[784,0.5],[659,1],
  [587,0.5],[587,0.5],[698,0.5],[587,0.5],[784,0.5],[698,0.5],[587,1],
  [659,0.5],[784,0.5],[880,0.5],[1047,0.5],[988,0.5],[880,0.5],[784,1],
  [659,0.5],[587,0.5],[523,0.5],[587,0.5],[659,1.5],[0,0.5],
];

function _getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _musicGain = _ctx.createGain(); _musicGain.gain.value = 0.1;
    _sfxGain   = _ctx.createGain(); _sfxGain.gain.value   = 0.32;
    _musicGain.connect(_ctx.destination);
    _sfxGain.connect(_ctx.destination);
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function _beep(freq, dur, type = 'square', gainNode, t) {
  const ctx = _getCtx();
  if (!gainNode) gainNode = _sfxGain;
  if (t === undefined) t = ctx.currentTime;
  if (!freq) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0.8, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(env);
  env.connect(gainNode);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// ── SFX ──────────────────────────────────────────────────────────
function sfxPlace() {
  const t = _getCtx().currentTime;
  _beep(523, 0.04, 'square', _sfxGain, t);
  _beep(659, 0.04, 'square', _sfxGain, t + 0.04);
  _beep(784, 0.09, 'square', _sfxGain, t + 0.08);
}

function sfxUndo() {
  const t = _getCtx().currentTime;
  _beep(400, 0.05, 'square', _sfxGain, t);
  _beep(280, 0.09, 'square', _sfxGain, t + 0.05);
}

function sfxEffect() {
  const t = _getCtx().currentTime;
  [300, 400, 550, 700].forEach((f, i) => _beep(f, 0.05, 'square', _sfxGain, t + i * 0.045));
}

function sfxColor() {
  const t = _getCtx().currentTime;
  for (let i = 0; i < 5; i++) {
    _beep(150 + Math.random() * 700, 0.035, 'square', _sfxGain, t + i * 0.035);
  }
}

function sfxFont() {
  const t = _getCtx().currentTime;
  _beep(440, 0.05, 'triangle', _sfxGain, t);
  _beep(660, 0.08, 'triangle', _sfxGain, t + 0.05);
}

function sfxMode() {
  const t = _getCtx().currentTime;
  _beep(350, 0.04, 'square', _sfxGain, t);
  _beep(500, 0.04, 'square', _sfxGain, t + 0.04);
  _beep(700, 0.07, 'square', _sfxGain, t + 0.08);
}

function sfxSize(up) {
  _beep(up ? 660 : 330, 0.05, 'square');
}

function sfxAxes() {
  const t = _getCtx().currentTime;
  _beep(440, 0.04, 'triangle', _sfxGain, t);
  _beep(550, 0.04, 'triangle', _sfxGain, t + 0.04);
}

function sfxCountdown(label) {
  const map = { '3': 330, '2': 440, '1': 587, 'GO!': 784 };
  _beep(map[label] || 523, 0.2, 'square');
}

function sfxGameStart() {
  const t = _getCtx().currentTime;
  [261, 329, 392, 523, 659].forEach((f, i) => _beep(f, 0.1, 'square', _sfxGain, t + i * 0.07));
}

function sfxGameEnd() {
  const t = _getCtx().currentTime;
  [659, 523, 392, 261].forEach((f, i) => _beep(f, 0.15, 'square', _sfxGain, t + i * 0.1));
}

// ── MUSIC ─────────────────────────────────────────────────────────
function _scheduleLoop(startAt) {
  if (!_musicPlaying) return;
  let t = startAt;
  let total = 0;
  MELODY.forEach(([freq, beats]) => {
    const dur = beats * B;
    if (freq) _beep(freq, dur * 0.72, 'square', _musicGain, t);
    t += dur;
    total += dur;
  });
  _musicTimer = setTimeout(() => _scheduleLoop(_getCtx().currentTime), (total - 0.15) * 1000);
}

function startMusic() {
  if (_musicPlaying) return;
  _musicPlaying = true;
  _scheduleLoop(_getCtx().currentTime + 0.05);
}

function stopMusic() {
  _musicPlaying = false;
  clearTimeout(_musicTimer);
  _musicTimer = null;
}
