/* BGFX — original Persona-3-style animated background (canvas, no video file needed):
   deep-blue gradient, a slow moon-phase cycle, a rotating clock ring and drifting glass shards. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const c = document.createElement("canvas"), ctx = c.getContext("2d");
  c.id = "bgfx"; document.getElementById("bg").insertBefore(c, document.getElementById("bg-stripes").nextSibling);
  document.body.classList.add("fx");
  let W, H, mx = 0, my = 0, sx = 0, sy = 0;
  const shards = Array.from({ length: 46 }, () => ({
    x: Math.random(), y: Math.random(), s: 8 + Math.random() * 38, r: Math.random() * 6.28,
    vr: (Math.random() - .5) * .006, v: .00006 + Math.random() * .00022, d: .3 + Math.random() * 1.1, a: .12 + Math.random() * .35,
  }));
  const resize = () => { const k = Math.min(devicePixelRatio || 1, 1.5); W = c.width = innerWidth * k; H = c.height = innerHeight * k; };
  addEventListener("resize", resize); resize();
  addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  function frame(t) {
    sx += (mx - sx) * .05; sy += (my - sy) * .05;
    const m = Math.min(W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#010512"); g.addColorStop(.6, "#05235e"); g.addColorStop(1, "#0a4ab8");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // moon with a slowly waxing / waning shadow
    const mxp = W * .78 - sx * 40, myp = H * .24 - sy * 30, mr = m * .13, ph = Math.sin(t / 9000);
    const glow = ctx.createRadialGradient(mxp, myp, mr * .6, mxp, myp, mr * 3.2);
    glow.addColorStop(0, "rgba(120,220,255,.35)"); glow.addColorStop(1, "rgba(120,220,255,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(mxp, myp, mr * 3.2, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#d8f6ff"; ctx.beginPath(); ctx.arc(mxp, myp, mr, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#05235e"; ctx.beginPath(); ctx.arc(mxp + ph * mr * 1.1, myp, mr * 1.02, 0, 6.28); ctx.fill();

    // clock ring
    ctx.save(); ctx.translate(W * .28 - sx * 70, H * .62 - sy * 50); ctx.rotate(t / 60000);
    ctx.strokeStyle = "rgba(160,235,255,.30)"; ctx.lineWidth = 2;
    const R = m * .62; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.28); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * .9, 0, 6.28); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.lineWidth = i % 3 ? 3 : 9;
      ctx.beginPath(); ctx.moveTo(R * .9, 0); ctx.lineTo(R * (i % 3 ? .96 : 1.04), 0); ctx.stroke(); ctx.restore();
    }
    ctx.rotate(-t / 20000); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * .7, 0); ctx.stroke();
    ctx.restore();

    // glass shards
    shards.forEach(s => {
      s.y -= s.v * 16; s.x += s.v * 6; s.r += s.vr;
      if (s.y < -.1) { s.y = 1.1; s.x = Math.random(); }
      if (s.x > 1.1) s.x = -.1;
      ctx.save(); ctx.translate(s.x * W - sx * 90 * s.d, s.y * H - sy * 60 * s.d); ctx.rotate(s.r);
      ctx.fillStyle = `rgba(120,215,255,${s.a})`; ctx.strokeStyle = `rgba(220,250,255,${s.a + .2})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-s.s, -s.s * .3); ctx.lineTo(s.s * .2, -s.s * .8); ctx.lineTo(s.s, s.s * .4); ctx.lineTo(-s.s * .4, s.s * .7); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    });
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
