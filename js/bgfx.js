/* BGFX — animated Persona-3-style wallpapers, one scene per screen, drawn on a canvas (no video files).
   home: moon + clock ring · projects: Dark Hour · skills: Velvet Room · about: dusk city · contact: rainy night */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches, R = Math.random, TAU = Math.PI * 2;
  const bg = document.getElementById("bg"), c = document.createElement("canvas"), ctx = c.getContext("2d");
  c.id = "bgfx"; c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  bg.insertBefore(c, bg.firstChild); document.body.classList.add("fx");
  let W, H, m, mx = 0, my = 0, sx = 0, sy = 0, scene = document.body.dataset.screen || "home";

  const shards = Array.from({ length: 46 }, () => ({ x: R(), y: R(), s: 8 + R() * 38, r: R() * TAU, vr: (R() - .5) * .006, v: .00006 + R() * .00022, d: .3 + R() * 1.1, a: .12 + R() * .35 }));
  const coffins = Array.from({ length: 16 }, () => ({ x: R(), y: R(), s: m || 90 + R() * 90, r: (R() - .5) * .5, v: .00004 + R() * .00009, d: .3 + R() * 1.2, p: R() * 9 }));
  const cards = Array.from({ length: 14 }, (_, i) => ({ p: R() * TAU, r: .25 + R() * .75, dir: i % 2 ? 1 : -1, w: .6 + R() * .6 }));
  const rain = Array.from({ length: 260 }, () => ({ x: R(), y: R(), l: .03 + R() * .06, v: .6 + R() }));
  const clouds = Array.from({ length: 8 }, () => ({ x: R(), y: .08 + R() * .35, s: .06 + R() * .1, v: .00001 + R() * .00003 }));
  const gulls = Array.from({ length: 5 }, () => ({ x: R(), y: .15 + R() * .3, s: 8 + R() * 10, v: .00004 + R() * .00005, p: R() * 9 }));
  const skyline = [["#27428c", .00002, .22], ["#162a62", .00005, .32], ["#091536", .0001, .42]].map(([col, sp, mh]) => {
    let x = 0; const b = []; while (x < 1.5) { const w = .02 + R() * .05; b.push({ x, w, h: .06 + R() * mh }); x += w + R() * .01; }
    return { col, sp, b };
  });

  const resize = () => { const k = Math.min(devicePixelRatio || 1, 1.5); W = c.width = innerWidth * k; H = c.height = innerHeight * k; m = Math.min(W, H); };
  addEventListener("resize", resize); resize();
  addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  new MutationObserver(() => { scene = document.body.dataset.screen; if (reduced) requestAnimationFrame(frame); }).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });

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
  function ring(cx, cy, r, rot, rgb, ticks) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = `rgba(${rgb},.3)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, TAU); ctx.stroke();
    for (let i = 0; i < ticks; i++) { ctx.save(); ctx.rotate(i * TAU / ticks); ctx.lineWidth = i % 3 ? 3 : 9; ctx.beginPath(); ctx.moveTo(r * .9, 0); ctx.lineTo(r * (i % 3 ? .96 : 1.04), 0); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }

  const scenes = {
    home(t) {
      fill(["#010512", "#05235e", "#0a4ab8"]);
      const x = W * .78 - sx * 40, y = H * .24 - sy * 30, r = m * .13;
      glow(x, y, r * 3.2, "120,220,255", .4); disc(x, y, r, "#d8f6ff"); disc(x + Math.sin(t / 9000) * r * 1.1, y, r * 1.02, "#05235e");
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
    about(t) {      // dusk over the bay city
      fill(["#0a2a78", "#3a6fd0", "#ff9966", "#ffd9a0"]);
      const sxp = W * .35 - sx * 30, syp = H * .7 - sy * 20; glow(sxp, syp, m * .7, "255,170,90", .55); disc(sxp, syp, m * .1, "#fff1c9");
      clouds.forEach(k => { k.x += k.v * 16; if (k.x > 1.3) k.x = -.3; for (let i = 0; i < 4; i++) { ctx.fillStyle = "rgba(255,225,215,.35)"; ctx.beginPath(); ctx.ellipse(k.x * W + i * k.s * m * .5 - sx * 30, k.y * H, k.s * m * .5, k.s * m * .18, 0, 0, TAU); ctx.fill(); } });
      gulls.forEach(g => { g.x += g.v * 16; if (g.x > 1.1) g.x = -.1; const f = Math.sin(t / 220 + g.p) * g.s * .5; ctx.strokeStyle = "rgba(20,30,70,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(g.x * W - g.s, g.y * H + f); ctx.quadraticCurveTo(g.x * W - g.s / 2, g.y * H - g.s * .4, g.x * W, g.y * H); ctx.quadraticCurveTo(g.x * W + g.s / 2, g.y * H - g.s * .4, g.x * W + g.s, g.y * H + f); ctx.stroke(); });
      skyline.forEach((L, i) => { ctx.fillStyle = L.col; L.b.forEach(b => { const x = (((b.x - t * L.sp) % 1.5) + 1.5) % 1.5 - .25; ctx.fillRect(x * W - sx * (20 + i * 20), H - b.h * H, b.w * W, b.h * H); }); });
    },
    contact(t) {    // rainy night street
      fill(["#010207", "#0b1020", "#1a1f2e"]);
      const lx = W * .82 - sx * 30, ly = H * .3 - sy * 20, fl = .55 + .08 * Math.sin(t / 130) - (Math.sin(t / 3100) > .985 ? .3 : 0);
      glow(lx, ly, m * .55, "255,190,60", fl); disc(lx, ly, m * .012, "#fff3c4");
      const g = ctx.createLinearGradient(0, H * .6, 0, H); g.addColorStop(0, "rgba(255,190,60,.25)"); g.addColorStop(1, "rgba(255,190,60,0)");
      ctx.fillStyle = g; ctx.fillRect(lx - m * .02 + Math.sin(t / 400) * 3, H * .6, m * .04, H * .4);
      ctx.strokeStyle = "rgba(200,220,255,.32)"; ctx.lineWidth = 1.5; ctx.beginPath();
      rain.forEach(d => { d.y += d.v * .018; d.x -= d.v * .003; if (d.y > 1.05) { d.y = -.1; d.x = R() * 1.1; } if (d.x < -.1) d.x = 1.1; ctx.moveTo(d.x * W, d.y * H); ctx.lineTo(d.x * W - d.l * W * .12, (d.y + d.l) * H); });
      ctx.stroke();
    },
  };

  function frame(t) {
    sx += (mx - sx) * .05; sy += (my - sy) * .05;
    (scenes[scene] || scenes.home)(reduced ? 0 : t);
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
