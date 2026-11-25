/* BGFX: animated Persona-style wallpapers drawn on a canvas (no video files). One scene per screen, in three themes:
   p5  Persona 5: red and black slashes, a turning star, rays and banners
   p5r Persona 5 Royal: the same cut-up look in warm black with gold glints and a gold star
   p3r Persona 3 Reload: deep blue, the moon, a clock ring, glass slabs and the Dark Hour / Velvet Room scenes */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches, R = Math.random, TAU = Math.PI * 2;
  const bg = document.getElementById("bg"), c = document.createElement("canvas"), ctx = c.getContext("2d", { alpha: false });
  c.id = "bgfx"; c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  bg.insertBefore(c, bg.firstChild); document.body.classList.add("fx");
  let W, H, m, mx = 0, my = 0, sx = 0, sy = 0, scene = document.body.dataset.screen || "home";
  const theme = () => document.documentElement.dataset.theme || "p5";

  const shards = Array.from({ length: 46 }, () => ({ x: R(), y: R(), s: 8 + R() * 38, r: R() * TAU, vr: (R() - .5) * .006, v: .00006 + R() * .00022, d: .3 + R() * 1.1, a: .12 + R() * .35 }));
  const coffins = Array.from({ length: 16 }, () => ({ x: R(), y: R(), s: m || 90 + R() * 90, r: (R() - .5) * .5, v: .00004 + R() * .00009, d: .3 + R() * 1.2, p: R() * 9 }));
  const cards = Array.from({ length: 14 }, (_, i) => ({ p: R() * TAU, r: .25 + R() * .75, dir: i % 2 ? 1 : -1, w: .6 + R() * .6 }));
  const glints = Array.from({ length: 16 }, () => ({ x: R(), y: R(), s: 8 + R() * 16, p: R() * 9, v: .0004 + R() * .0006 }));

  const resize = () => { let k = Math.min(devicePixelRatio || 1, 1.5); const px = innerWidth * innerHeight * k * k; if (px > 1.3e6) k *= Math.sqrt(1.3e6 / px);   // keep the pixel count sane on big or hi-dpi screens
    W = c.width = Math.round(innerWidth * k); H = c.height = Math.round(innerHeight * k); m = Math.min(W, H); };
  addEventListener("resize", resize); resize();
  addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  let paused = false, holds = 0, lastT = 0, running = false, f = 1, prevT = 0;   // f = frames elapsed at 60 Hz, so motion speed never depends on the refresh rate
  const redrawStill = () => { if (reduced || paused) requestAnimationFrame(still); };
  new MutationObserver(() => { scene = document.body.dataset.screen; redrawStill(); }).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });
  new MutationObserver(redrawStill).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- drawing helpers ---------- */
  // Static gradients are painted once into an offscreen canvas and then blitted, which is far cheaper than rebuilding a
  // gradient every frame and avoids the garbage that causes small stutters.
  const layers = new Map();
  const cached = (key, paint) => {
    key += "|" + W + "x" + H; let l = layers.get(key);
    if (!l) { if (layers.size > 24) layers.clear(); l = document.createElement("canvas"); l.width = W; l.height = H; paint(l.getContext("2d")); layers.set(key, l); }
    ctx.drawImage(l, 0, 0);
  };
  const lin = (g, x1, y1, x2, y2, stops) => { const gr = g.createLinearGradient(x1, y1, x2, y2); stops.forEach((st, i) => gr.addColorStop(i / (stops.length - 1), st)); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const fill = stops => cached("v" + stops, g => lin(g, 0, 0, 0, H, stops));
  const diag = stops => cached("d" + stops, g => lin(g, 0, 0, W, H, stops));
  const glow = (x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const disc = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  function drawShards(rgb, line) {
    ctx.fillStyle = `rgb(${rgb})`; ctx.strokeStyle = `rgb(${line})`; ctx.lineWidth = 1;
    shards.forEach(s => {
      s.y -= s.v * 16 * f; s.x += s.v * 6 * f; s.r += s.vr * f; if (s.y < -.1) { s.y = 1.1; s.x = R(); } if (s.x > 1.1) s.x = -.1;
      ctx.setTransform(Math.cos(s.r), Math.sin(s.r), -Math.sin(s.r), Math.cos(s.r), s.x * W - sx * 90 * s.d, s.y * H - sy * 60 * s.d);
      ctx.beginPath(); ctx.moveTo(-s.s, -s.s * .3); ctx.lineTo(s.s * .2, -s.s * .8); ctx.lineTo(s.s, s.s * .4); ctx.lineTo(-s.s * .4, s.s * .7); ctx.closePath();
      ctx.globalAlpha = s.a; ctx.fill(); ctx.globalAlpha = Math.min(1, s.a + .2); ctx.stroke();
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  }
  function ring(cx, cy, r, rot, rgb, ticks) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = `rgba(${rgb},.3)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, TAU); ctx.stroke();
    for (let i = 0; i < ticks; i++) { ctx.save(); ctx.rotate(i * TAU / ticks); ctx.lineWidth = i % 3 ? 3 : 9; ctx.beginPath(); ctx.moveTo(r * .9, 0); ctx.lineTo(r * (i % 3 ? .96 : 1.04), 0); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }
  // five-pointed star, the Phantom Thieves' mark
  function star(cx, cy, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .382 : r; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    ctx.closePath();
  }
  // four-point glint
  function glint(x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s * .5, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s * .5, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.closePath();
  }
  function drawGlints(t, rgb) {
    ctx.fillStyle = `rgb(${rgb})`;
    glints.forEach(g => { const k = (Math.sin(t * g.v + g.p) + 1) / 2; ctx.globalAlpha = .15 + k * .75; glint(g.x * W - sx * 50, g.y * H - sy * 35, g.s * (.5 + k)); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  // a tilted strip of repeating text that scrolls sideways
  function band(y, tilt, bg, fg, text, scroll) {
    const h = m * .075;
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(tilt);
    ctx.fillStyle = bg; ctx.fillRect(-W, -h / 2, W * 2, h);
    ctx.fillStyle = fg; ctx.font = `400 ${h * .72}px Anton, Impact, sans-serif`; ctx.textBaseline = "middle";
    const unit = ctx.measureText(text).width, off = ((scroll % unit) + unit) % unit;
    for (let x = -W - off; x < W; x += unit) ctx.fillText(text, x, 2);
    ctx.restore();
  }
  // slanted slabs that slide slowly
  function slashes(cols, n, t, spread, lean) {
    for (let i = 0; i < n; i++) {
      const off = Math.sin(t / 9000 + i * 1.9) * W * .02 - sx * 40 * (1 + i * .25), x0 = W * (i * spread - .1) + off, w = W * (.07 + (i % 3) * .05);
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath(); ctx.moveTo(x0 + lean, 0); ctx.lineTo(x0 + lean + w, 0); ctx.lineTo(x0 + w, H); ctx.lineTo(x0, H); ctx.closePath(); ctx.fill();
    }
  }
  function thin(col, xs, t, lean) {
    ctx.fillStyle = col;
    xs.forEach((x, i) => { const x0 = W * x - sx * 60 + Math.sin(t / 7000 + i) * W * .015; ctx.beginPath(); ctx.moveTo(x0 + lean, 0); ctx.lineTo(x0 + lean + 5, 0); ctx.lineTo(x0 + 5, H); ctx.lineTo(x0, H); ctx.closePath(); ctx.fill(); });
  }
  function emblem(cx, cy, r, t, line, inner) {
    star(cx, cy, r, t / 20000); ctx.fillStyle = "#000"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = line; ctx.stroke();
    star(cx, cy, r * .56, -t / 14000); ctx.fillStyle = inner; ctx.fill();
  }
  // a wheel of broken arcs, like a turning gear
  function wheel(cx, cy, r, t, colA, colB) {
    for (let k = 0; k < 3; k++) {
      const rr = r * (1 - k * .24), segs = 7 + k * 2, dir = k % 2 ? -1 : 1, rot = t / (16000 + k * 6000) * dir;
      ctx.lineWidth = r * .1; ctx.strokeStyle = k % 2 ? colB : colA;
      for (let i = 0; i < segs; i++) { const a = rot + i * TAU / segs; ctx.beginPath(); ctx.arc(cx, cy, rr, a, a + TAU / segs * .62); ctx.stroke(); }
    }
  }
  function orbitCards(cx, cy, t, fillCol, lineCol) {
    cards.forEach(k => {
      const a = t / 9000 * k.dir + k.p, r = m * (.2 + k.r * .5), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .55;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a * .5); const w = m * .05 * k.w, h = w * 1.5;
      ctx.fillStyle = fillCol; ctx.strokeStyle = lineCol; ctx.lineWidth = 2; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.restore();
    });
  }
  function rays(cx, cy, t, cols, vignette) {
    const far = Math.hypot(W, H), n = 26, rot = t / 45000;
    for (let i = 0; i < n; i += 2) {
      ctx.fillStyle = cols[(i / 2) % cols.length];
      const a0 = rot + i * TAU / n, a1 = a0 + TAU / n;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * far, cy + Math.sin(a0) * far); ctx.lineTo(cx + Math.cos(a1) * far, cy + Math.sin(a1) * far); ctx.closePath(); ctx.fill();
    }
    cached("vg" + vignette, g => {   // a fixed vignette, so it can be painted once
      const vx = W * .7, vy = H * .5, v = g.createRadialGradient(vx, vy, m * .12, vx, vy, far * .7); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, vignette);
      g.fillStyle = v; g.fillRect(0, 0, W, H);
    });
  }

  /* ---------- Persona 5 and Persona 5 Royal: one set of scenes, two palettes ---------- */
  const slashScenes = pal => ({
    home(t) {      // slashes, a star and a clock ring
      diag(pal.base); slashes(pal.slashes, 3, t, .34, H * .55); thin(pal.line, [.46], t, H * .55);
      emblem(W * .8 - sx * 60, H * .3 - sy * 40, m * .3, t, pal.line, pal.inner);
      ring(W * .26 - sx * 70, H * .64 - sy * 50, m * .56, t / 60000, pal.ring, 12);
      drawShards(pal.shard, pal.shard); if (pal.glint) drawGlints(t, pal.glint);
    },
    projects(t) {  // a turning wheel, like Mementos
      diag(pal.base); slashes(pal.slashes, 2, t, .5, H * .4);
      wheel(W * .3 - sx * 40, H * .58 - sy * 30, m * .52, t, pal.wheelA, pal.wheelB);
      star(W * .3 - sx * 40, H * .58 - sy * 30, m * .13, t / 12000); ctx.fillStyle = pal.inner; ctx.fill();
      drawShards(pal.shard, pal.shard); if (pal.glint) drawGlints(t, pal.glint);
    },
    skills(t) {    // a star in a ring, with cards orbiting it
      diag(pal.base); slashes(pal.slashes, 2, t, .6, H * .3);
      const cx = W * .7 - sx * 50, cy = H * .5 - sy * 30;
      ring(cx, cy, m * .5, t / 30000, pal.ring, 24);
      emblem(cx, cy, m * .22, t, pal.line, pal.inner);
      orbitCards(cx, cy, t, pal.cardFill, pal.cardLine);
      drawShards(pal.shard, pal.shard); if (pal.glint) drawGlints(t, pal.glint);
    },
    about(t) {     // slashes with a big turning star
      diag(pal.base); slashes(pal.slashes, 5, t, .24, H * .55); thin(pal.line, [.18, .68], t, H * .55);
      emblem(W * .8 - sx * 70, H * .72 - sy * 50, m * .46, t, pal.line, pal.inner);
      drawShards(pal.shard, pal.shard); if (pal.glint) drawGlints(t, pal.glint);
    },
    contact(t) {   // rays from behind the card, with scrolling banners
      fill(pal.contactBase);
      rays(W * .7 - sx * 50, H * .5 - sy * 30, t, pal.rays, "rgba(0,0,0,.88)");
      band(H * .76, -.08, "#fff", "#000", "SAY HELLO  //  GET IN TOUCH  //  ", t * .05);
      band(H * .9, -.05, pal.bandB, pal.bandInk, "TAKE YOUR TIME  //  ", -t * .04);
      drawShards(pal.shard, pal.shard); if (pal.glint) drawGlints(t, pal.glint);
    },
  });

  const p5 = slashScenes({
    base: ["#050002", "#1c0005", "#4a0008"], contactBase: ["#000", "#12000a", "#000"], slashes: ["#a8000e", "#e60012"],
    line: "rgba(255,255,255,.9)", inner: "#e60012", ring: "255,255,255", shard: "255,255,255", glint: null,
    wheelA: "#e60012", wheelB: "#ffffff", cardFill: "rgba(230,0,18,.3)", cardLine: "rgba(255,255,255,.8)",
    rays: ["#c70012"], bandB: "#e60012", bandInk: "#000",
  });
  const p5r = slashScenes({
    base: ["#070500", "#1d1203", "#4a0a06"], contactBase: ["#000", "#130b00", "#000"], slashes: ["#8f0012", "#d4001a"],
    line: "rgba(255,206,60,.95)", inner: "#ffc61a", ring: "255,206,60", shard: "255,226,140", glint: "255,214,90",
    wheelA: "#d4001a", wheelB: "#ffc61a", cardFill: "rgba(255,198,26,.22)", cardLine: "rgba(255,226,140,.85)",
    rays: ["#b8000f", "#d9a400"], bandB: "#ffc61a", bandInk: "#000",
  });

  /* ---------- Persona 3 Reload: the moon, the clock, the Dark Hour, the Velvet Room ---------- */
  const p3r = {
    home(t) {
      fill(["#010512", "#05235e", "#0a4ab8"]);
      // the moon shows today's real phase (same maths as the home-screen calendar)
      const x = W * .74 - sx * 40, y = H * .23 - sy * 30, r = m * .13;
      const f = ((((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530589) + 29.530589) % 29.530589 / 29.530589;
      const off = f < .5 ? -r * 2.1 * (f / .5) : r * 2.1 * (1 - (f - .5) / .5);
      glow(x, y, r * 3.2, "120,220,255", .4); disc(x, y, r, "#d8f6ff");
      if (Math.abs(off) < r * 2.05) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r + .5, 0, TAU); ctx.clip(); disc(x + off, y, r * 1.02, "rgba(4,24,70,.94)"); ctx.restore(); }
      ring(W * .28 - sx * 70, H * .62 - sy * 50, m * .62, t / 60000, "160,235,255", 12);
      drawShards("120,215,255", "220,250,255");
    },
    projects(t) {  // the Dark Hour
      fill(["#010a07", "#06352a", "#0c6b4f"]);
      const x = W * .5 - sx * 30, y = H * .36 - sy * 20;
      glow(x, y, m * .6, "140,255,200", .35); disc(x, y, m * .2, "#c9ffe6"); disc(x + m * .03, y - m * .02, m * .19, "rgba(6,53,42,.35)");
      coffins.forEach(k => {
        k.y -= k.v * 10 * f; if (k.y < -.25) { k.y = 1.25; k.x = R(); }
        const w = m * .05, h = m * .12;
        ctx.save(); ctx.translate(k.x * W - sx * 60 * k.d, k.y * H - sy * 40 * k.d); ctx.rotate(k.r + Math.sin(t / 2200 + k.p) * .08);
        ctx.fillStyle = "rgba(2,20,15,.88)"; ctx.strokeStyle = "rgba(120,255,190,.55)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-w * .5, -h * .25); ctx.lineTo(0, -h * .5); ctx.lineTo(w * .5, -h * .25); ctx.lineTo(w * .35, h * .5); ctx.lineTo(-w * .35, h * .5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      });
      drawShards("110,255,190", "200,255,230");
    },
    skills(t) {    // the Velvet Room
      fill(["#04021a", "#14126b", "#3a2aa8"]);
      const cx = W * .68 - sx * 50, cy = H * .5 - sy * 30; glow(cx, cy, m * .8, "120,100,255", .3);
      for (let k = 0; k < 4; k++) { ctx.setLineDash([m * .02, m * .03]); ring(cx, cy, m * (.2 + k * .14), t / (15000 + k * 8000) * (k % 2 ? -1 : 1), "190,170,255", 0); }
      ctx.setLineDash([]);
      orbitCards(cx, cy, t, "rgba(120,100,255,.25)", "rgba(215,200,255,.7)");
      drawShards("150,130,255", "225,215,255");
    },
    about(t) {     // blue glass slabs around a big clock ring
      diag(["#020b24", "#08306f", "#1456c4"]);
      glow(W * .22 - sx * 30, H * .25 - sy * 20, m * .5, "120,200,255", .3);
      for (let i = 0; i < 4; i++) {
        const x0 = W * (.08 + i * .26) + Math.sin(t / 8000 + i * 1.6) * W * .02 - sx * 40, w = W * .16, lean = H * .45;
        ctx.fillStyle = "rgba(90,170,255,.12)"; ctx.strokeStyle = "rgba(190,225,255,.4)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 + lean, 0); ctx.lineTo(x0 + lean + w, 0); ctx.lineTo(x0 + w, H); ctx.lineTo(x0, H); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ring(W * .8 - sx * 60, H * .72 - sy * 40, m * .62, t / 50000, "170,220,255", 24);
      ring(W * .8 - sx * 60, H * .72 - sy * 40, m * .36, -t / 40000, "170,220,255", 12);
      drawShards("120,200,255", "220,245,255");
    },
    contact(t) {   // blue rays from behind the card, with scrolling banners
      fill(["#010612", "#04153a", "#010612"]);
      rays(W * .7 - sx * 50, H * .5 - sy * 30, t, ["#1456c4", "#0a2f78"], "rgba(1,6,20,.88)");
      band(H * .76, -.08, "#eaf4ff", "#04122f", "SAY HELLO  //  GET IN TOUCH  //  ", t * .05);
      band(H * .9, -.05, "#2160f0", "#fff", "TAKE YOUR TIME  //  ", -t * .04);
      drawShards("120,200,255", "220,245,255");
    },
  };

  const scenes = { p5, p5r, p3r };
  const pick = () => { const set = scenes[theme()] || p5; return set[scene] || set.home; };

  // one static frame: used for reduced motion and when the visitor pauses the background
  function still() { pick()(lastT); }
  function frame(t) {
    if (paused || reduced || holds > 0) { running = false; return; }
    requestAnimationFrame(frame);
    // The wallpaper moves slowly, so it is drawn at most about 70 times a second: on a 120 or 240 Hz screen that leaves the
    // rest of the frame to the cursor, scrolling and menus, which still run at the full refresh rate.
    const dt = t - prevT;
    if (prevT && dt < 13.5) return;
    f = Math.min(prevT ? dt : 16.7, 50) / 16.67; prevT = t;
    const e = 1 - Math.exp(-f * .05);
    sx += (mx - sx) * e; sy += (my - sy) * e; lastT = t;
    pick()(t);
  }
  function start() { if (!running && !paused && !reduced && holds === 0) { running = true; prevT = 0; requestAnimationFrame(frame); } }
  addEventListener("resize", () => { if (paused || reduced) requestAnimationFrame(still); });
  // hold(true) freezes the wallpaper while something big animates or covers it (screen wipes, windows), so the browser isn't
  // painting a canvas nobody can see; hold(false) lets it carry on. Calls nest.
  window.BGFX = {
    setPaused(p) { paused = p; p ? requestAnimationFrame(still) : start(); },
    hold(on) { holds = Math.max(0, holds + (on ? 1 : -1)); if (holds === 0) start(); },
  };
  reduced ? requestAnimationFrame(still) : start();
})();
