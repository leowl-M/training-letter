// ── CONFIGURAZIONE ────────────────────────────────────────────────
const chars      = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
let fonts = []; // populated in preload() with p5.Font objects
const fontNames  = ['PPFrama Regular', 'PPFrama Black Italic'];
const fontPaths  = [
  'font/PPFrama-Regular.otf',
  'font/PPFrama-ExtraboldItalic.otf',
  'font/PPFrama-BlackItalic.otf'
];
const effects    = ['Solido', 'Moduli: Punti', 'Moduli: Geometria', 'Stroke: Tratteggio', 'Op-Art: Onde'];

// ── PALETTE (6 colori configurabili) ─────────────────────────────
const palette = [
  '#4A60FF',
  '#CEFF00',
  '#FF3EBA',
  '#31A362',
  '#F7F6EB',
  '#141414',
];
// ─────────────────────────────────────────────────────────────────
