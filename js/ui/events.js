lucide.createIcons();
const $ = id => document.getElementById(id);

let _toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
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
const openBtn = $('sidebar-open-btn');

$('sidebar-close-btn').addEventListener('click', () => {
  sidebar.classList.add('-translate-x-full');
  openBtn.classList.remove('opacity-0', 'pointer-events-none');
});

openBtn.addEventListener('click', () => {
  sidebar.classList.remove('-translate-x-full');
  openBtn.classList.add('opacity-0', 'pointer-events-none');
});

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

window.addEventListener('gamepadconnected', () => { $('no-pad-msg').style.opacity = '0'; });
window.addEventListener('gamepaddisconnected', () => { $('no-pad-msg').style.opacity = '1'; });
