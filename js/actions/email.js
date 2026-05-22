// ── EMAIL EXPORT ──────────────────────────────────────────────────
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://training-letter-backend.onrender.com';

function captureCanvas() {
  renderWorld(true);
  return cnv.elt.toDataURL('image/png');
}

function openEmailModal() {
  const base64 = captureCanvas();
  document.getElementById('email-modal-preview').src = base64;
  document.getElementById('email-modal-preview').dataset.image = base64;
  document.getElementById('email-modal').classList.remove('hidden');
  document.getElementById('email-input').value = '';
  document.getElementById('email-modal-status').textContent = '';
  document.getElementById('email-input').focus();
}

function closeEmailModal() {
  document.getElementById('email-modal').classList.add('hidden');
  if (typeof gameState !== 'undefined' && gameState === 'ended') restartGame();
}

async function sendEmail(email, base64) {
  const statusEl = document.getElementById('email-modal-status');
  const btnEl    = document.getElementById('email-modal-send');

  statusEl.textContent = 'Invio in corso...';
  statusEl.className   = 'text-xs text-neutral-400';
  btnEl.disabled       = true;

  try {
    const res = await fetch(`${BACKEND_URL}/send-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, image: base64 }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Errore sconosciuto');

    statusEl.textContent = 'Email inviata!';
    statusEl.className   = 'text-xs text-green-400';
    setTimeout(() => {
      document.getElementById('email-modal').classList.add('hidden');
      if (typeof restartGame === 'function') restartGame();
      if (typeof startGame === 'function') startGame();
    }, 1800);
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className   = 'text-xs text-red-400';
  } finally {
    btnEl.disabled = false;
  }
}
