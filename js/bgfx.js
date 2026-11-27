/* BGFX: page side of the animated wallpaper. It creates the canvas and then runs the drawing code (bgfx-core.js) in a Web Worker
   on an OffscreenCanvas, so it can't stall the page. If the browser can't do that (older browsers, or the page opened straight
   from disk, where workers are blocked), the same code runs on the main thread instead. Scripts load in order: bgfx-core.js first. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches, p3 = matchMedia("(color-gamut: p3)").matches;
  const bg = document.getElementById("bg");
  const mk = () => { const c = document.createElement("canvas"); c.id = "bgfx"; c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block"; return c; };
  let canvas = mk(); bg.insertBefore(canvas, bg.firstChild); document.body.classList.add("fx");
  const info = () => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio || 1, scene: document.body.dataset.screen || "home", theme: document.documentElement.dataset.theme || "p5" });
  let send = () => {}, local = null, mode = "starting", last = null;   // one of these is the active backend

  function onMain() {
    mode = "main"; local = createBgfx(canvas, { reduced, p3, maxPx: 1.3e6, raf: f => requestAnimationFrame(f), makeLayer: (w, h) => { const l = document.createElement("canvas"); l.width = w; l.height = h; return l; } });
    const i = info(); local.resize(i.w, i.h, i.dpr); local.set(i.scene, i.theme); local.start();
    send = d => {
      if (d.type === "resize") local.resize(d.w, d.h, d.dpr); else if (d.type === "mouse") local.mouse(d.x, d.y);
      else if (d.type === "set") local.set(d.scene, d.theme); else if (d.type === "paused") local.setPaused(d.on); else if (d.type === "hold") local.hold(d.on);
    };
  }

  function onWorker() {
    let w, done = false;
    const fail = () => { if (done) return; done = true; try { w && w.terminate(); } catch {} onMain(); };
    try { w = new Worker("js/bgfx-worker.js?v=20261127a"); } catch { fail(); return; }
    const timer = setTimeout(fail, 1500);
    w.onerror = () => { clearTimeout(timer); fail(); };
    w.onmessage = e => {
      if (done) return;
      clearTimeout(timer);
      if (e.data.type !== "ready") { fail(); return; }
      done = true; mode = "worker"; w.onmessage = m => { if (m.data.type === "stats") last = m.data.data; };
      const off = canvas.transferControlToOffscreen();
      send = d => w.postMessage(d);
      w.postMessage({ type: "init", canvas: off, reduced, p3, ...info() }, [off]);
    };
    w.postMessage({ type: "probe" });
  }

  const canWorker = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && canvas.transferControlToOffscreen && location.protocol !== "file:";
  canWorker ? onWorker() : onMain();

  addEventListener("resize", () => send({ type: "resize", ...info() }));
  let mp = null;
  addEventListener("mousemove", e => {
    if (mp) { mp = [e.clientX, e.clientY]; return; }
    mp = [e.clientX, e.clientY];
    requestAnimationFrame(() => { send({ type: "mouse", x: mp[0] / innerWidth - .5, y: mp[1] / innerHeight - .5 }); mp = null; });   // at most one message per frame
  }, { passive: true });
  const push = () => { const i = info(); send({ type: "set", scene: i.scene, theme: i.theme }); };
  new MutationObserver(push).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });
  new MutationObserver(push).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.BGFX = { get mode() { return mode; }, stats() { if (local) return local.stats(); send({ type: "stats" }); return last; }, setPaused: on => send({ type: "paused", on }), hold: on => send({ type: "hold", on }) };
})();
