let players = [];
const MAX_PLAYERS = 4;
let globalColorVal = palette[0];
let needsHudUpdate = true;

function initPlayers() {
  players = [];
  for (let i = 0; i < MAX_PLAYERS; i++) {
    players.push({
      active: i === 0, // Player 1 active by default
      x: logicalW / 2, y: logicalH / 4,
      selectedChar: 'A',
      charIdx: 0, fontIdx: 0,
      effectIdx: 0,
      size: 150, weight: 0,
      rot: 0, sx: 1.0, sy: 1.0,
      effectA: 0.5, effectB: 0.5,
      snapGrid: false,
      toolMode: 'deform',
      prevButtons: [],
      history: []
    });
    }
    needsHudUpdate = true;
    }

    let logicalW = window.innerWidth;
    let logicalH = window.innerHeight;
    let cnv;

    let isRecordingGif = false;
    let bgColorIdx = 1;

    let placedGroups = [];

