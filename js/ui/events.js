lucide.createIcons();
const $ = id => document.getElementById(id);

let _toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  if (typeof palette !== 'undefined' && typeof bgColorIdx !== 'undefined' && typeof globalColorVal !== 'undefined') {
    const bg  = palette[bgColorIdx];
    const col = globalColorVal;
    t.style.background = col;
    t.style.color      = bg;
  }
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

$('btnSave').addEventListener('click', () => saveSketch());
$('btnGif').addEventListener('click', () => saveGifExport());
$('btnClear').addEventListener('click', () => clearAll());
$('btnEmail').addEventListener('click', () => openEmailModal());

$('email-modal-close').addEventListener('click', () => closeEmailModal());
$('email-modal-cancel').addEventListener('click', () => closeEmailModal());
$('email-modal-send').addEventListener('click', () => {
  const email  = $('email-input').value.trim();
  const base64 = $('email-modal-preview').dataset.image;
  if (!email) { $('email-modal-status').textContent = 'Inserisci un indirizzo email.'; return; }
  sendEmail(email, base64);
});

const sidebar = $('sidebar');

$('sidebar-close-btn').addEventListener('click', () => sidebar.classList.add('-translate-x-full'));

document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 's' || e.key === 'S') {
    sidebar.classList.toggle('-translate-x-full');
  }
  if (e.key === ' ' || e.key === 'Enter') {
    if (typeof gameState !== 'undefined' && gameState === 'ready') startGame();
  }
  if (e.key === 'i' || e.key === 'I') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
}, true);

$('wordInput').addEventListener('input', (e) => {
  if (players[0]) {
    players[0].selectedChar = e.target.value.toUpperCase() || 'A';
  }
});

// Gestione del Color Picker nativo
$('colorPicker').addEventListener('input', (e) => {
  // Aggiorna in tempo reale la variabile in sketch.js
  if (typeof updateColorFromPicker === 'function') {
    updateColorFromPicker(e.target.value);
  }
  $('hud-color').textContent = e.target.value.toUpperCase();
});

window.addEventListener('gamepadconnected', () => {
  if (typeof gameState !== 'undefined' && gameState === 'playing') {
    $('no-pad-msg').style.opacity = '0';
  }
});
window.addEventListener('gamepaddisconnected', () => {
  if (typeof gameState !== 'undefined' && gameState === 'playing') {
    $('no-pad-msg').style.opacity = '1';
  }
});

initGameFlow();
