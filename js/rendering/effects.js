// ── FONT LOADING (opentype.js) ────────────────────────────────────
let otFonts = [];

async function loadOtFonts() {
  otFonts = [];
  for (let path of fontPaths) {
    try {
      const buf = await fetch(path).then(r => r.arrayBuffer());
      otFonts.push(opentype.parse(buf));
    } catch(e) {
      otFonts.push(null);
    }
  }
}

// ── AXES DEFORMATION ─────────────────────────────────────────────
function mapPtsAxes(contours, fn) {
  return contours.map(c => c.map(cmd => {
    if (cmd.type === 'Z') return {...cmd};
    const r = {...cmd};
    if (r.x  !== undefined) { const p=fn(r.x, r.y);  r.x=p.x;  r.y=p.y;  }
    if (r.x1 !== undefined) { const p=fn(r.x1,r.y1); r.x1=p.x; r.y1=p.y; }
    if (r.x2 !== undefined) { const p=fn(r.x2,r.y2); r.x2=p.x; r.y2=p.y; }
    return r;
  }));
}

function applyAxes(contours, ax) {
  let c = contours.map(cont => cont.map(cmd => ({...cmd})));
  const bb = getBBox(c);
  const {cx, cy, w, h} = bb;

  if (ax.wd !== 0) {
    const sc = 1 + ax.wd * 0.008;
    c = mapPtsAxes(c, (x,y) => ({x: cx+(x-cx)*sc, y}));
  }
  if (ax.wt !== 0) {
    const st = ax.wt * 0.002;
    c = mapPtsAxes(c, (x,y) => ({x: x+(x-cx)*st, y: y+(y-cy)*st}));
  }
  if (ax.ct !== 0) {
    const st = ax.ct * 0.003;
    c = mapPtsAxes(c, (x,y) => {
      const ry = (y-cy) / ((h/2)||1);
      return {x: cx+(x-cx)*(1+Math.abs(ry)*st), y};
    });
  }
  if (ax.sl !== 0) {
    const sh = Math.tan(ax.sl * Math.PI/180) * 0.5;
    c = mapPtsAxes(c, (x,y) => ({x: x+(cy-y)*sh, y}));
  }
  if (ax.fl > 0) {
    const st = ax.fl * 0.004;
    c = mapPtsAxes(c, (x,y) => {
      const dy = (y-cy) / ((h/2)||1);
      return {x: x+dy*dy*st*Math.sign(x-cx+0.001)*(w/2), y};
    });
  }
  if (ax.rn > 0) {
    const tt = ax.rn/100 * 0.72;
    c = c.map(cont => cont.map((cmd,i,arr) => {
      if (cmd.type !== 'C') return cmd;
      let prev = null;
      for (let j=i-1;j>=0;j--) { if (arr[j].x!==undefined&&arr[j].type!=='Z'){prev=arr[j];break;} }
      const r = {...cmd};
      if (prev) { r.x1+=(prev.x-r.x1)*tt; r.y1+=(prev.y-r.y1)*tt; }
      r.x2+=(r.x-r.x2)*tt; r.y2+=(r.y-r.y2)*tt;
      return r;
    }));
  }
  return c;
}

function applyAxesToPoints(pts, axes, size) {
  if (!axes || !pts.length) return pts;
  let cx=0, cy=0;
  pts.forEach(p => { cx+=p.x; cy+=p.y; });
  cx /= pts.length; cy /= pts.length;
  const h = size, w = size;
  return pts.map(p => {
    let x=p.x, y=p.y;
    if (axes.wd !== 0) { x = cx+(x-cx)*(1+axes.wd*0.008); }
    if (axes.wt !== 0) { const st=axes.wt*0.002; x+=(x-cx)*st; y+=(y-cy)*st; }
    if (axes.ct !== 0) { const st=axes.ct*0.003; const ry=(y-cy)/((h/2)||1); x=cx+(x-cx)*(1+Math.abs(ry)*st); }
    if (axes.sl !== 0) { const sh=Math.tan(axes.sl*Math.PI/180)*0.5; x+=(cy-y)*sh; }
    if (axes.fl > 0)   { const st=axes.fl*0.004; const dy=(y-cy)/((h/2)||1); x+=dy*dy*st*Math.sign(x-cx+0.001)*(w/2); }
    return {...p, x, y};
  });
}

// ── OPENTYPE CONTOUR EXTRACTION ───────────────────────────────────
function getContours(font, letter, fontSize) {
  const glyph = font.charToGlyph(letter);
  if (!glyph) return [];
  const path = glyph.getPath(0, 0, fontSize);
  const contours = [];
  let cur = null;
  path.commands.forEach(cmd => {
    if (cmd.type === 'M') {
      if (cur && cur.length > 1) contours.push(cur);
      cur = [{type:'M', x:cmd.x, y:cmd.y}];
    } else if (cmd.type === 'L') {
      cur && cur.push({type:'L', x:cmd.x, y:cmd.y});
    } else if (cmd.type === 'C') {
      cur && cur.push({type:'C', x1:cmd.x1, y1:cmd.y1, x2:cmd.x2, y2:cmd.y2, x:cmd.x, y:cmd.y});
    } else if (cmd.type === 'Q') {
      if (cur && cur.length) {
        const p0 = cur[cur.length-1];
        cur.push({type:'C',
          x1:p0.x+2/3*(cmd.x1-p0.x), y1:p0.y+2/3*(cmd.y1-p0.y),
          x2:cmd.x+2/3*(cmd.x1-cmd.x), y2:cmd.y+2/3*(cmd.y1-cmd.y),
          x:cmd.x, y:cmd.y});
      }
    } else if (cmd.type === 'Z') {
      cur && cur.push({type:'Z'});
      if (cur && cur.length > 1) { contours.push(cur); cur = null; }
    }
  });
  if (cur && cur.length > 1) contours.push(cur);
  return contours;
}

function getBBox(contours) {
  let x0=1e9, x1=-1e9, y0=1e9, y1=-1e9;
  contours.forEach(c => c.forEach(cmd => {
    [[cmd.x,cmd.y],[cmd.x1,cmd.y1],[cmd.x2,cmd.y2]].forEach(([x,y]) => {
      if (x === undefined) return;
      x0=Math.min(x0,x); x1=Math.max(x1,x);
      y0=Math.min(y0,y); y1=Math.max(y1,y);
    });
  }));
  return {x0, x1, y0, y1, w:x1-x0, h:y1-y0, cx:(x0+x1)/2, cy:(y0+y1)/2};
}

function makePath2D(contours) {
  const bb = getBBox(contours);
  const ox = -(bb.x0 + bb.w/2);
  const oy = -(bb.y0 + bb.h/2);
  const p2 = new Path2D();
  contours.forEach(cont => cont.forEach(cmd => {
    if      (cmd.type==='M') p2.moveTo(cmd.x+ox, cmd.y+oy);
    else if (cmd.type==='L') p2.lineTo(cmd.x+ox, cmd.y+oy);
    else if (cmd.type==='C') p2.bezierCurveTo(cmd.x1+ox,cmd.y1+oy,cmd.x2+ox,cmd.y2+oy,cmd.x+ox,cmd.y+oy);
    else if (cmd.type==='Z') p2.closePath();
  }));
  return p2;
}

// ── MASK CANVAS ───────────────────────────────────────────────────
const maskCanvas = document.createElement('canvas');
const maskCtx    = maskCanvas.getContext('2d', {willReadFrequently: true});
let maskPx = null, maskW = 0, maskH = 0, maskKey = '';

function axKey(ax) {
  if (!ax) return '0|0|0|0|0|0';
  return `${Math.round(ax.wt)}|${Math.round(ax.wd)}|${Math.round(ax.sl)}|${Math.round(ax.ct)}|${Math.round(ax.fl)}|${Math.round(ax.rn)}`;
}

function buildMask(otFont, letter, fontSize, fontIdx, axes) {
  const key = `${letter}|${fontIdx}|${Math.round(fontSize)}|${axKey(axes)}`;
  if (key === maskKey && maskPx) return;
  maskKey = key;

  const W = Math.ceil(fontSize * 1.5);
  const H = Math.ceil(fontSize * 1.5);
  maskW = W; maskH = H;
  maskCanvas.width = W; maskCanvas.height = H;
  maskCtx.fillStyle = '#000';
  maskCtx.fillRect(0, 0, W, H);
  if (!otFont) return;

  const raw = getContours(otFont, letter, fontSize);
  if (!raw.length) return;
  const def = axes ? applyAxes(raw, axes) : raw;
  const bb  = getBBox(def);
  const ox  = W/2 - (bb.x0 + bb.w/2);
  const oy  = H/2 - (bb.y0 + bb.h/2);

  const p2 = new Path2D();
  def.forEach(cont => cont.forEach(cmd => {
    if      (cmd.type==='M') p2.moveTo(cmd.x+ox, cmd.y+oy);
    else if (cmd.type==='L') p2.lineTo(cmd.x+ox, cmd.y+oy);
    else if (cmd.type==='C') p2.bezierCurveTo(cmd.x1+ox,cmd.y1+oy,cmd.x2+ox,cmd.y2+oy,cmd.x+ox,cmd.y+oy);
    else if (cmd.type==='Z') p2.closePath();
  }));
  maskCtx.fillStyle = '#fff';
  maskCtx.fill(p2, 'evenodd');
  maskPx = maskCtx.getImageData(0, 0, W, H).data;
}

function smpl(lx, ly) {
  const ix = Math.round(lx + maskW/2);
  const iy = Math.round(ly + maskH/2);
  if (!maskPx || ix<0 || ix>=maskW || iy<0 || iy>=maskH) return 0;
  return maskPx[(iy*maskW+ix)*4] / 255;
}
function ins(lx, ly) { return smpl(lx, ly) > 0.5; }

// ── MARCHING SQUARES ─────────────────────────────────────────────
const MSL = [
  [],[[0,.5],[.5,0]],[[.5,0],[1,.5]],[[0,.5],[1,.5]],
  [[1,.5],[.5,1]],[[0,.5],[.5,0],[1,.5],[.5,1]],[[.5,0],[.5,1]],[[0,.5],[.5,1]],
  [[.5,1],[0,.5]],[[.5,1],[.5,0]],[[1,.5],[.5,1],[0,.5],[.5,0]],[[.5,1],[1,.5]],
  [[0,.5],[1,.5]],[[.5,0],[1,.5]],[[0,.5],[.5,0]],[]
];

function marchSq(thr, step) {
  const hw = maskW/2, hh = maskH/2;
  const segs = [];
  for (let mx=0; mx<maskW-step; mx+=step) {
    for (let my=0; my<maskH-step; my+=step) {
      const lx=mx-hw, ly=my-hh;
      const v00=smpl(lx,ly)>thr?1:0, v10=smpl(lx+step,ly)>thr?1:0;
      const v11=smpl(lx+step,ly+step)>thr?1:0, v01=smpl(lx,ly+step)>thr?1:0;
      const idx = v00*8+v10*4+v11*2+v01;
      const pairs = MSL[idx];
      for (let i=0; i<pairs.length; i+=2) {
        const a=pairs[i], b=pairs[i+1];
        segs.push({x1:lx+a[0]*step, y1:ly+a[1]*step, x2:lx+b[0]*step, y2:ly+b[1]*step});
      }
    }
  }
  return segs;
}

function segs2polys(segs, eps) {
  if (!segs.length) return [];
  const used = new Uint8Array(segs.length), polys = [];
  for (let i=0; i<segs.length; i++) {
    if (used[i]) continue;
    const poly = [{x:segs[i].x1, y:segs[i].y1}, {x:segs[i].x2, y:segs[i].y2}];
    used[i] = 1; let ch = true;
    while (ch) {
      ch = false;
      const tail = poly[poly.length-1];
      for (let j=0; j<segs.length; j++) {
        if (used[j]) continue;
        const d1 = (tail.x-segs[j].x1)**2 + (tail.y-segs[j].y1)**2;
        const d2 = (tail.x-segs[j].x2)**2 + (tail.y-segs[j].y2)**2;
        if (d1<eps*eps) { poly.push({x:segs[j].x2, y:segs[j].y2}); used[j]=1; ch=true; break; }
        if (d2<eps*eps) { poly.push({x:segs[j].x1, y:segs[j].y1}); used[j]=1; ch=true; break; }
      }
    }
    if (poly.length > 3) polys.push(poly);
  }
  return polys;
}

function drawPolyline(ctx, pts) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i=1; i<pts.length-1; i++) {
    const mx = (pts[i].x+pts[i+1].x)/2, my = (pts[i].y+pts[i+1].y)/2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  ctx.stroke();
}

function drawHatchSet(ctx, gap, angle) {
  const cos=Math.cos(angle), sin=Math.sin(angle);
  const diag = Math.sqrt(maskW*maskW+maskH*maskH)/2;
  const steps = Math.ceil(diag*3.2);
  for (let off=-diag; off<diag; off+=gap) {
    let seg = [];
    for (let s=0; s<=steps; s++) {
      const t2 = (s/steps)*diag*2-diag;
      const lx = cos*t2+(-sin)*off, ly = sin*t2+cos*off;
      if (ins(lx,ly)) seg.push({x:lx, y:ly});
      else { if (seg.length>1) drawPolyline(ctx,seg); seg=[]; }
    }
    if (seg.length>1) drawPolyline(ctx,seg);
  }
}

// ── VT EFFECTS (canvas2D) ─────────────────────────────────────────
function drawVtEffect(ctx, otFont, letter, fontSize, colorVal, strokeW, effectA, effectB, fxName, fontIdx, axes) {
  if (!otFont) return;

  if (fxName !== 'clean') {
    buildMask(otFont, letter, fontSize, fontIdx, axes);
    if (!maskPx) return;
  }

  ctx.save();
  ctx.strokeStyle = colorVal;
  ctx.fillStyle   = colorVal;
  ctx.lineWidth   = Math.max(1, strokeW || 2);
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';

  const hw = maskW/2, hh = maskH/2;

  switch (fxName) {

    case 'clean': {
      const raw = getContours(otFont, letter, fontSize);
      if (!raw.length) break;
      const def = axes ? applyAxes(raw, axes) : raw;
      ctx.fill(makePath2D(def), 'evenodd');
      break;
    }

    case 'contours': {
      const levels = Math.round(3 + effectA * 27);
      const spread = effectB * 0.18;
      const step   = 3;
      for (let lv=1; lv<=levels; lv++) {
        let thr = lv / (levels + 1);
        thr += spread * (lv % 2 === 0 ? 1 : -1) * thr * (1 - thr);
        thr = Math.max(.02, Math.min(.97, thr));
        segs2polys(marchSq(thr, step), step*1.6)
          .forEach(poly => { if (poly.length >= 3) drawPolyline(ctx, poly); });
      }
      break;
    }

    case 'hatch': {
      const gap   = 2 + effectA * 18;
      const angle = effectB * Math.PI;
      drawHatchSet(ctx, gap, angle);
      break;
    }

    case 'dots': {
      const step     = Math.max(3, Math.round(3 + effectA * 17));
      const szRatio  = 0.2 + effectB * 0.75;
      for (let lx=-hw+step/2; lx<hw; lx+=step) {
        for (let ly=-hh+step/2; ly<hh; ly+=step) {
          const v = smpl(lx, ly);
          if (v < 0.05) continue;
          const sz = Math.max(1, step * szRatio * v);
          ctx.beginPath(); ctx.arc(lx, ly, sz/2, 0, Math.PI*2); ctx.fill();
        }
      }
      break;
    }

    case 'lines': {
      const gap  = 2 + effectA * 18;
      const amp  = effectB * 40;
      const freq = 0.018;
      for (let ly=-hh+gap/2; ly<hh; ly+=gap) {
        let seg = [];
        for (let lx=-hw; lx<=hw; lx+=2) {
          const sy = ly + Math.sin(lx * freq) * amp;
          if (ins(lx, sy)) seg.push({x:lx, y:sy});
          else { if (seg.length>1) drawPolyline(ctx, seg); seg=[]; }
        }
        if (seg.length>1) drawPolyline(ctx, seg);
      }
      break;
    }
  }

  ctx.restore();
}

// ── RENDER LETTERA ────────────────────────────────────────────────
function drawLetter(charStr, colorVal, effectIdx, weight, size, effectA, effectB, fontObj, fontIdx, axes) {
  if (effectA === undefined) effectA = 0.5;
  if (effectB === undefined) effectB = 0.5;
  if (fontIdx  === undefined) fontIdx = 0;

  const otFont = otFonts[fontIdx] || otFonts[0] || null;

  // VT effects (5-8) — canvas2D, static, parametric
  if (effectIdx >= 5) {
    const names = ['contours','hatch','dots','lines'];
    const name  = names[effectIdx - 5];
    if (name) drawVtEffect(drawingContext, otFont, charStr, size, colorVal, weight, effectA, effectB, name, fontIdx, axes);
    return;
  }

  // Solido (0) — opentype con assi attivi
  if (effectIdx === 0 && otFont && axes && Object.values(axes).some(v => v !== 0)) {
    drawVtEffect(drawingContext, otFont, charStr, size, colorVal, weight, effectA, effectB, 'clean', fontIdx, axes);
    return;
  }

  // ── p5 effects ────────────────────────────────────────────────────
  if (!fontObj && effectIdx > 0) effectIdx = 0;
  textSize(size);
  textAlign(CENTER, CENTER);
  fill(colorVal);
  noStroke();

  if (effectIdx === 1) {
    const density = map(effectA, 0, 1, 0.05, 0.5);
    let pts = fontObj.textToPoints(charStr, 0, 0, size, { sampleFactor: density });
    pts = applyAxesToPoints(pts, axes, size);
    const dotSize = map(effectB, 0, 1, 2, 30);
    for (let p of pts) circle(p.x, p.y, dotSize);

  } else if (effectIdx === 2) {
    const density = map(effectA, 0, 1, 0.05, 0.3);
    let pts = fontObj.textToPoints(charStr, 0, 0, size, { sampleFactor: density });
    pts = applyAxesToPoints(pts, axes, size);
    const modSize = map(effectB, 0, 1, 2, 40);
    for (let p of pts) {
      push();
      translate(p.x, p.y);
      rotate(p.x * 0.01);
      rectMode(CENTER);
      rect(0, 0, modSize, modSize * 0.2);
      rect(0, 0, modSize * 0.2, modSize);
      pop();
    }

  } else if (effectIdx === 3) {
    const dashLen = map(effectA, 0, 1, 5, 100);
    const gapLen  = map(effectB, 0, 1, 2, 60);
    noFill();
    stroke(colorVal);
    strokeWeight(weight > 0 ? weight : 2);
    drawingContext.setLineDash([dashLen, gapLen]);
    drawingContext.lineDashOffset = 0;
    text(charStr, 0, 0);
    drawingContext.setLineDash([]);

  } else if (effectIdx === 4) {
    let pts = fontObj.textToPoints(charStr, 0, 0, size, { sampleFactor: 0.2 });
    pts = applyAxesToPoints(pts, axes, size);
    const freq = map(effectA, 0, 1, 0.01, 0.2);
    const amp  = map(effectB, 0, 1, 0, 50);
    beginShape();
    for (let p of pts) vertex(p.x + sin(p.y * freq) * amp, p.y);
    endShape(CLOSE);

  } else {
    if (weight > 0) { stroke(colorVal); strokeWeight(weight); }
    text(charStr, 0, 0);
  }
}
