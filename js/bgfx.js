/* BGFX: animated Persona-style wallpapers, one scene per screen, drawn on a canvas (no video files).
   home: moon + clock ring · projects: Dark Hour · skills: Velvet Room · about: red and black slashes + star · contact: red rays + banners */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches, R = Math.random, TAU = Math.PI * 2;
  const bg = document.getElementById("bg"), c = document.createElement("canvas"), ctx = c.getContext("2d");
  c.id = "bgfx"; c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  bg.insertBefore(c, bg.firstChild); document.body.classList.add("fx");
  let W, H, m, mx = 0, my = 0, sx = 0, sy = 0, scene = document.body.dataset.screen || "home";

  const shards = Array.from({ length: 46 }, () => ({ x: R(), y: R(), s: 8 + R() * 38, r: R() * TAU, vr: (R() - .5) * .006, v: .00006 + R() * .00022, d: .3 + R() * 1.1, a: .12 + R() * .35 }));
  const coffins = Array.from({ length: 16 }, () => ({ x: R(), y: R(), s: m || 90 + R() * 90, r: (R() - .5) * .5, v: .00004 + R() * .00009, d: .3 + R() * 1.2, p: R() * 9 }));
  const cards = Array.from({ length: 14 }, (_, i) => ({ p: R() * TAU, r: .25 + R() * .75, dir: i % 2 ? 1 : -1, w: .6 + R() * .6 }));

  const resize = () => { const k = Math.min(devicePixelRatio || 1, 1.5); W = c.width = innerWidth * k; H = c.height = innerHeight * k; m = Math.min(W, H); };
  addEventListener("resize", resize); resize();
  addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  let paused = false, lastT = 0, running = false;
  new MutationObserver(() => { scene = document.body.dataset.screen; if (reduced || paused) requestAnimationFrame(still); }).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });

  const fill = stops => { const g = ctx.createLinearGradient(0, 0, 0, H); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  const glow = (x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const disc = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  function drawShards(rgb, line) {
    shards.forEach(s => {
      s.y -= s.v * 16; s.x += s.v * 6; s.r += s.vr; if (s.y < -.1) { s.y = 1.1; s.x = R(); } if (s.x > 1.1) s.x = -.1;
      ctx.save(); ctx.translate(s.x * W - sx * 90 * s.d, s.y * H - sy * 60 * s.d); ctx.rotate(s.r);
      ctx.fillStyle = `rgba(${rgb},${s.a})`; ctx.strokeStyle = `rgba(${line},${s.a + .2})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-s.s, -s.s * .3); ctx.lineTo(s.s * .2, -s.s * .8); ctx.lineTo(s.s, s.s * .4); ctx.lineTo(-s.s * .4, s.s * .7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    });
  }
  // five-pointed star, the Phantom Thieves' mark
  function star(cx, cy, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .382 : r; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    ctx.closePath();
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
  function ring(cx, cy, r, rot, rgb, ticks) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = `rgba(${rgb},.3)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, TAU); ctx.stroke();
    for (let i = 0; i < ticks; i++) { ctx.save(); ctx.rotate(i * TAU / ticks); ctx.lineWidth = i % 3 ? 3 : 9; ctx.beginPath(); ctx.moveTo(r * .9, 0); ctx.lineTo(r * (i % 3 ? .96 : 1.04), 0); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }

  const scenes = {
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
    projects(t) {   // Dark Hour
      fill(["#010a07", "#06352a", "#0c6b4f"]);
      const x = W * .5 - sx * 30, y = H * .36 - sy * 20;
      glow(x, y, m * .6, "140,255,200", .35); disc(x, y, m * .2, "#c9ffe6"); disc(x + m * .03, y - m * .02, m * .19, "rgba(6,53,42,.35)");
      coffins.forEach(k => {
        k.y -= k.v * 10; if (k.y < -.25) { k.y = 1.25; k.x = R(); }
        const w = m * .05, h = m * .12;
        ctx.save(); ctx.translate(k.x * W - sx * 60 * k.d, k.y * H - sy * 40 * k.d); ctx.rotate(k.r + Math.sin(t / 2200 + k.p) * .08);
        ctx.fillStyle = "rgba(2,20,15,.88)"; ctx.strokeStyle = "rgba(120,255,190,.55)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-w * .5, -h * .25); ctx.lineTo(0, -h * .5); ctx.lineTo(w * .5, -h * .25); ctx.lineTo(w * .35, h * .5); ctx.lineTo(-w * .35, h * .5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      });
      drawShards("110,255,190", "200,255,230");
    },
    skills(t) {     // Velvet Room
      fill(["#04021a", "#14126b", "#3a2aa8"]);
      const cx = W * .68 - sx * 50, cy = H * .5 - sy * 30; glow(cx, cy, m * .8, "120,100,255", .3);
      for (let k = 0; k < 4; k++) { ctx.setLineDash([m * .02, m * .03]); ring(cx, cy, m * (.2 + k * .14), t / (15000 + k * 8000) * (k % 2 ? -1 : 1), "190,170,255", 0); }
      ctx.setLineDash([]);
      cards.forEach(k => {
        const a = t / 9000 * k.dir + k.p, r = m * (.2 + k.r * .5), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .55;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a * .5); const w = m * .05 * k.w, h = w * 1.5;
        ctx.fillStyle = "rgba(120,100,255,.25)"; ctx.strokeStyle = "rgba(215,200,255,.7)"; ctx.lineWidth = 2; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.restore();
      });
      drawShards("150,130,255", "225,215,255");
    },
    about(t) {      // red and black slashes with a turning star
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#050002"); g.addColorStop(.5, "#1c0005"); g.addColorStop(1, "#4a0008");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const lean = H * .55;
      for (let i = 0; i < 5; i++) {
        const off = Math.sin(t / 9000 + i * 1.9) * W * .02 - sx * 40 * (1 + i * .25), x0 = W * (i * .24 - .1) + off, w = W * (.07 + (i % 3) * .05);
        ctx.fillStyle = i % 2 ? "#e60012" : "#a8000e";
        ctx.beginPath(); ctx.moveTo(x0 + lean, 0); ctx.lineTo(x0 + lean + w, 0); ctx.lineTo(x0 + w, H); ctx.lineTo(x0, H); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let i = 0; i < 2; i++) { const x0 = W * (.18 + i * .5) - sx * 60 + Math.sin(t / 7000 + i) * W * .015; ctx.beginPath(); ctx.moveTo(x0 + lean, 0); ctx.lineTo(x0 + lean + 5, 0); ctx.lineTo(x0 + 5, H); ctx.lineTo(x0, H); ctx.closePath(); ctx.fill(); }
      const cx = W * .8 - sx * 70, cy = H * .72 - sy * 50;
      star(cx, cy, m * .46, t / 20000); ctx.fillStyle = "#000"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = "#fff"; ctx.stroke();
      star(cx, cy, m * .26, -t / 14000); ctx.fillStyle = "#e60012"; ctx.fill();
      drawShards("255,255,255", "255,255,255");
    },
    contact(t) {    // red rays bursting from behind the card, with scrolling banners
      fill(["#000", "#12000a", "#000"]);
      const cx = W * .7 - sx * 50, cy = H * .5 - sy * 30, far = Math.hypot(W, H), n = 26, rot = t / 45000;
      ctx.fillStyle = "#c70012";
      for (let i = 0; i < n; i += 2) {
        const a0 = rot + i * TAU / n, a1 = a0 + TAU / n;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * far, cy + Math.sin(a0) * far); ctx.lineTo(cx + Math.cos(a1) * far, cy + Math.sin(a1) * far); ctx.closePath(); ctx.fill();
      }
      const v = ctx.createRadialGradient(cx, cy, m * .12, cx, cy, far * .7); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.88)");
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      band(H * .76, -.08, "#fff", "#000", "SAY HELLO  //  GET IN TOUCH  //  ", t * .05);
      band(H * .9, -.05, "#e60012", "#000", "TAKE YOUR TIME  //  ", -t * .04);
      drawShards("255,255,255", "255,255,255");
    },
  };

  // one static frame: used for reduced motion and when the visitor pauses the background
  function still() { (scenes[scene] || scenes.home)(lastT); }
  function frame(t) {
    if (paused || reduced) { running = false; return; }
    sx += (mx - sx) * .05; sy += (my - sy) * .05; lastT = t;
    (scenes[scene] || scenes.home)(t);
    requestAnimationFrame(frame);
  }
  function start() { if (!running && !paused && !reduced) { running = true; requestAnimationFrame(frame); } }
  addEventListener("resize", () => { if (paused || reduced) requestAnimationFrame(still); });
  window.BGFX = { setPaused(p) { paused = p; p ? requestAnimationFrame(still) : start(); } };
  reduced ? requestAnimationFrame(still) : start();
})();
