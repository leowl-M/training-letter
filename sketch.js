function preload() {
  for (let path of fontPaths) {
    fonts.push(loadFont(path));
  }
}

// ── SETUP ─────────────────────────────────────────────────────────
function setup() {
  const wrap = document.getElementById('canvasWrap');
  const main = wrap.parentElement;
  logicalW = main.clientWidth;
  logicalH = main.clientHeight;

  cnv = createCanvas(logicalW, logicalH);
  cnv.parent('canvasWrap');
  pixelDensity(1);

  blendModeValues = [BLEND, MULTIPLY, SCREEN, OVERLAY, DIFFERENCE, EXCLUSION];
  
  initPlayers();

  new ResizeObserver(() => fitCanvas()).observe(main);
  textAlign(CENTER, CENTER);
  updateHUD();
}

function draw() {
  handleGamepad();
  renderWorld(isRecordingGif);
}
