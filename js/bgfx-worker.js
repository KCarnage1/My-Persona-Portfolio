/* Web Worker host for the animated wallpaper: it owns an OffscreenCanvas, so drawing and compositing happen off the page's main
   thread. The page sends it sizes, the pointer position, the current screen and look, and pause/hold requests. */
importScripts("bgfx-core.js" + self.location.search);   // same ?v= tag as the worker itself, so a new release never mixes versions
let api = null;
const raf = self.requestAnimationFrame ? f => self.requestAnimationFrame(f) : null;
self.onmessage = e => {
  const d = e.data;
  if (d.type === "probe") {   // can this browser run the wallpaper here? Checked before the canvas is handed over.
    let ok = !!raf && typeof OffscreenCanvas !== "undefined";
    if (ok) { try { ok = !!new OffscreenCanvas(2, 2).getContext("2d"); } catch { ok = false; } }
    self.postMessage({ type: ok ? "ready" : "unsupported" });
  } else if (d.type === "init") {
    // The banners on the contact screen use the page's display font. A worker doesn't share the page's fonts, so it loads its own
    // copy; until that arrives (or if it can't) the banners use Impact or a bold sans-serif.
    if (self.fonts && typeof FontFace !== "undefined") {
      fetch("https://fonts.googleapis.com/css2?family=Anton&display=swap").then(r => r.text()).then(css => {
        const u = /url\((https:[^)]+)\)/.exec(css); if (!u) return;
        return new FontFace("Anton", `url(${u[1]})`).load().then(ff => self.fonts.add(ff));
      }).catch(() => {});
    }
    api = createBgfx(d.canvas, { reduced: d.reduced, p3: d.p3, maxPx: 3.2e6, raf, makeLayer: (w, h) => new OffscreenCanvas(w, h) });
    api.resize(d.w, d.h, d.dpr); api.set(d.scene, d.theme); api.start();
  } else if (!api) return;
  else if (d.type === "resize") api.resize(d.w, d.h, d.dpr);
  else if (d.type === "mouse") api.mouse(d.x, d.y);
  else if (d.type === "set") api.set(d.scene, d.theme);
  else if (d.type === "paused") api.setPaused(d.on);
  else if (d.type === "hold") api.hold(d.on);
  else if (d.type === "stats") self.postMessage({ type: "stats", data: api.stats() });
};
