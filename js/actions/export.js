// ── SAVE / EXPORT ─────────────────────────────────────────────────
function saveSketch() {
  renderWorld(true);
  saveCanvas(cnv, `typo-export-${logicalW}x${logicalH}`, 'png');
  toast('PNG esportato!');
}

function saveGifExport() {
  isRecordingGif = true;
  toast('GIF in registrazione (3s)...');
  saveGif(`typo-anim-${logicalW}x${logicalH}`, 3, { units: 'seconds' });
  setTimeout(() => { isRecordingGif = false; toast('GIF salvata!'); }, 3200);
}
