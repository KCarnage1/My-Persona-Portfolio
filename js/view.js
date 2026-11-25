/* VIEW: everything that draws. No app logic. */
const View = {
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  forceBox: { CLOUD: ["O"], IT: ["T"] },
  els: { screens: {}, menuItems: [], tabs: [] },
  io: null,
  toastTimer: 0,

  init() {
    const $ = s => document.querySelector(s);
    Object.assign(this.els, {
      wipe: $("#wipe"), wipeText: $("#wipe-text"), wipeKicker: $("#wipe-kicker"),
      repoGrid: $("#repo-grid"), repoStatus: $("#repo-status"),
      filters: $("#filters"),
      skillsBody: $("#skills-body"), aboutBody: $("#about-body"), sfx: $("#sfx-select"),
      cursor: $("#cursor"), clock: $("#clock"), caption: $("#menu-caption span"),
      progress: $("#progress"), toTop: $("#to-top"), toast: $("#toast"),
      modal: $("#modal"), modalPanel: $("#modal .modal-panel"), modalBody: $("#modal-body"),
      palette: $("#palette"), paletteInput: $("#palette-input"), paletteList: $("#palette-list"),
      help: $("#help"), soundBtn: $("#sound-toggle"), motionBtn: $("#motion-toggle"),
    });
    document.querySelectorAll(".screen").forEach(s => (this.els.screens[s.id.replace("screen-", "")] = s));
    this.els.menuItems = [...document.querySelectorAll(".menu-item")];
    this.els.tabs = [...document.querySelectorAll(".tab")];
    this.els.menuItems.forEach((m, i) => m.style.setProperty("--m", i));
    document.querySelectorAll("[data-ransom]").forEach(el => this.ransomize(el));
    this.els.sfx.volume = 0.4;
    this.gsap = !this.reduced && window.gsap && window.ScrollTrigger ? window.gsap : null;
    if (this.gsap) this.gsap.registerPlugin(ScrollTrigger);
    this.startClock(); this.startParallax(); this.startCursor(); this.startTilt();
  },

  hash(str) { let h = 9; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 387420489); return (h ^ (h >>> 9)) >>> 0; },
  esc: s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  md: s => s.replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>'),

  /* ---------- ransom-note lettering ---------- */
  ransomize(el, text = el.dataset.ransom) {
    const forced = this.forceBox[text] || [];
    el.textContent = "";
    const label = document.createElement("span"); label.className = "sr-only"; label.textContent = text; el.appendChild(label);
    [...text].forEach((c, i) => {
      const s = document.createElement("span"), h = this.hash(text + i);
      s.className = "ch"; s.textContent = c; s.style.setProperty("--i", i); s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--t", `rotate(${(h % 13) - 6}deg) scale(${0.92 + ((h >> 3) % 16) / 100}) translateY(${((h >> 5) % 7) - 3}px)`);
      const v = (h >> 7) % 10;
      if (forced.includes(c) || v === 0) s.classList.add("box"); else if (v === 1) s.classList.add("boxw"); else if (v === 2) s.classList.add("red");
      el.appendChild(s);
    });
  },

  /* ---------- screens ---------- */
  showScreen(name) {
    const S = this.els.screens;
    Object.values(S).forEach(s => s.classList.remove("active"));
    const s = S[name]; s.classList.add("active"); s.scrollTop = 0;
    document.body.dataset.screen = name;
    s.querySelectorAll(".reveal").forEach((e, i) => e.style.setProperty("--i", Math.min(i, 10)));
    this.els.tabs.forEach(t => { const on = t.dataset.nav === name; t.classList.toggle("on", on); on ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"); });
    document.title = (name === "home" ? "" : name[0].toUpperCase() + name.slice(1) + " · ") + "Portfolio · Cloud Engineering / IT";
    this.updateScroll(s);
    // scroll-reveal for long text, replayed on every visit
    this.io && this.io.disconnect();
    const sr = s.querySelectorAll(".sr");
    if (sr.length) {
      sr.forEach(e => e.classList.remove("seen"));
      this.io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("seen"); this.io.unobserve(en.target); }
      }), { root: s, threshold: 0.12 });
      sr.forEach(e => this.io.observe(e));
    }
    if (this.gsap) requestAnimationFrame(() => ScrollTrigger.refresh());
  },

  setMenuSelection(i, caption) {
    this.els.menuItems.forEach((m, j) => m.classList.toggle("sel", j === i));
    const c = this.els.caption;
    if (c.textContent === caption) return;
    c.textContent = caption; c.classList.remove("swap"); void c.offsetWidth; c.classList.add("swap");
  },

  updateScroll(s) {
    const max = s.scrollHeight - s.clientHeight;
    this.els.progress.style.setProperty("--p", max > 0 ? s.scrollTop / max : 0);
    this.els.toTop.classList.toggle("show", s.classList.contains("sub") && s.scrollTop > 500);
  },

  /* ---------- Persona 3-style calendar (real date, time of day, moon phase) ---------- */
  renderCalendar(d = new Date()) {
    const h = d.getHours(), wd = d.getDay();
    document.getElementById("cal-md").textContent = `${d.getMonth() + 1}/${d.getDate()}`;
    const w = document.getElementById("cal-wd");
    w.textContent = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][wd];
    w.className = "cal-wd" + (wd === 0 ? " sun" : "");
    const phase = h === 0 ? "Dark Hour" : h < 5 ? "Late Night" : h < 7 ? "Early Morning" : h < 12 ? "Morning" : h < 13 ? "Lunchtime"
      : h < 16 ? "Afternoon" : h < 18 ? "After School" : "Evening";
    const p = document.getElementById("cal-phase"); p.textContent = phase; p.classList.toggle("dark", h === 0);
    // moon age from a known new moon (2000-01-06 18:14 UTC), synodic month 29.53 days
    const age = (((d - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530589 + 29.530589) % 29.530589, f = age / 29.530589;
    const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    document.getElementById("cal-moon").textContent = names[Math.floor(f * 8 + 0.5) % 8];
    // lit area: outer half-circle on the lit side, inner ellipse whose width follows the phase
    const r = 17, k = Math.cos(f * 2 * Math.PI) * r, wax = f < 0.5;
    const outer = `M20 3 A${r} ${r} 0 0 ${wax ? 1 : 0} 20 37`;
    const inner = `A${Math.abs(k)} ${r} 0 0 ${wax === (k > 0) ? 0 : 1} 20 3`;
    document.getElementById("moon-lit").setAttribute("d", outer + " " + inner + " Z");
  },

  // Three skewed panes sweep across with the destination's name; swap() runs while the screen is fully covered.
  // dir = 1 sweeps left to right, -1 right to left (used when going back through the tabs).
  wipe(label, kicker, dir, swap, done) {
    if (this.reduced) { swap(); done(); return; }
    const w = this.els.wipe, panes = [...w.querySelectorAll(".pane")], lab = w.querySelector(".wipe-label");
    this.ransomize(this.els.wipeText, label); this.els.wipeKicker.textContent = kicker;
    const T = x => `translateX(${x * dir}%) skewX(-14deg)`;
    const opt = (d, i) => ({ duration: d, delay: i * 60, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" });
    w.style.display = "block"; let freed = false; const free = () => { if (!freed) { freed = true; window.BGFX && BGFX.hold(false); } };
    window.BGFX && BGFX.hold(true); setTimeout(free, 3000);
    lab.animate([{ opacity: 0, transform: `translateX(${-60 * dir}px) skewX(-8deg)` }, { opacity: 1, transform: "none" }], { duration: 300, delay: 240, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    Promise.all(panes.map((p, i) => p.animate([{ transform: T(-130) }, { transform: T(0) }], opt(400, i)).finished))
      .then(() => new Promise(r => setTimeout(r, 150)))
      .then(() => {
        swap();
        lab.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${80 * dir}px)` }], { duration: 220, easing: "ease-in", fill: "both" });
        return Promise.all(panes.map((p, i) => p.animate([{ transform: T(0) }, { transform: T(130) }], opt(460, 2 - i)).finished));
      })
      .then(() => { w.style.display = "none"; [...panes, lab].forEach(p => p.getAnimations().forEach(a => a.cancel())); free(); done(); });
  },

  // First visit in a session: the panes start covering the screen with a short title card, then slide away.
  // Any key or click skips it; later visits in the same session skip it entirely.
  boot(full, done) {
    const body = document.body, w = this.els.wipe, panes = [...w.querySelectorAll(".pane")], lab = w.querySelector(".wipe-label");
    if (this.reduced) { body.classList.remove("booting"); done(); return; }
    let left = false;
    const leave = () => {
      if (left) return; left = true;
      removeEventListener("keydown", leave, true); removeEventListener("pointerdown", leave, true);
      lab.animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(80px)" }], { duration: 220, easing: "ease-in", fill: "both" });
      w.style.display = "block"; body.classList.remove("booting");
      Promise.all(panes.map((p, i) => p.animate([{ transform: "translateX(0) skewX(-14deg)" }, { transform: "translateX(130%) skewX(-14deg)" }], { duration: full ? 560 : 420, delay: (2 - i) * 60, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" }).finished))
        .then(() => { w.style.display = "none"; [...panes, lab].forEach(p => p.getAnimations().forEach(a => a.cancel())); done(); });
    };
    if (!full) { leave(); return; }
    this.ransomize(this.els.wipeText, "TAKE YOUR TIME"); this.els.wipeKicker.textContent = "Welcome";
    lab.animate([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    addEventListener("keydown", leave, true); addEventListener("pointerdown", leave, true);
    setTimeout(leave, 900);
  },

  playSelect() { try { this.els.sfx.currentTime = 0; const p = this.els.sfx.play(); p && p.catch && p.catch(() => {}); } catch {} },
  setSound(on) { this.els.soundBtn.setAttribute("aria-pressed", on); },
  setTheme(id) {
    const t = Model.themes.find(x => x.id === id) || Model.themes[0];
    if (t.id === "p5") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t.id;
    const b = document.getElementById("theme-btn");
    if (b) { b.firstElementChild.textContent = t.short; b.lastElementChild.textContent = "Switch theme. Current: " + t.name; }
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t.color;
    if (!this.cursorsLoaded) { this.cursorsLoaded = true; ["p5r", "p3r"].forEach(n => ["normal", "link"].forEach(k => { new Image().src = `assets/cursors/${n}-${k}.png`; })); }
    this.refreshCursor && this.refreshCursor();
    if (typeof Music !== "undefined") Music.forTheme();
    if (typeof Music !== "undefined" && Music.viz) Music.draw();
  },
  setMotion(on) { this.els.motionBtn.setAttribute("aria-pressed", on); window.BGFX && window.BGFX.setPaused(!on); },

  toast(msg) {
    const t = this.els.toast; t.textContent = msg; t.classList.add("show");
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  },

  /* ---------- projects ---------- */
  splitTitle(t) { const e = this.esc(t), f = e.split(" ")[0]; return `<em>${f}</em>${e.slice(f.length)}`; },
  catLabel(cats, id) { return (cats.find(c => c.id === id) || {}).label || id; },
  paint(el, p) { el.style.setProperty("--pc", p.color); el.style.setProperty("--on", p.ink || "#000"); },

  cover(p, n, label) {
    if (p.img) return `<div class="thumb"><img src="${this.esc(p.img)}" alt="" width="640" height="260" loading="lazy" onerror="this.parentNode.remove()"></div>`;
    return `<div class="cover" aria-hidden="true"><span class="cover-cat">${this.esc(label)}</span><span class="cover-num">${String(n).padStart(2, "0")}</span><span class="cover-word">${this.esc(p.cover || p.title.split(" ")[0])}</span></div>`;
  },
  // real screenshots when the project has them (first one large, the rest as thumbnails); otherwise the drawn cover
  media(p, n, label) {
    if (!p.shots || !p.shots.length) return this.cover(p, n, label);
    const [first] = p.shots;
    return `<div class="gallery"><figure class="shot"><img src="${this.esc(first.src)}" alt="${this.esc(first.alt)}" width="1280" height="720" decoding="async">
      <figcaption>${this.esc(first.alt)}</figcaption></figure>
      ${p.shots.length > 1 ? `<div class="thumbs" role="group" aria-label="Screenshots">${p.shots.map((sh, i) => `<button class="thumb-btn" data-shot="${i}" aria-pressed="${i === 0}"><img src="${this.esc(sh.src)}" alt="" width="1280" height="720" loading="lazy" decoding="async"><span class="sr-only">Show screenshot ${i + 1}: ${this.esc(sh.alt)}</span></button>`).join("")}</div>` : ""}</div>`;
  },
  showShot(btn, p) {
    const g = btn.closest(".gallery"), sh = p.shots[+btn.dataset.shot], img = g.querySelector(".shot img");
    g.querySelectorAll(".thumb-btn").forEach(b => b.setAttribute("aria-pressed", b === btn));
    g.querySelector("figcaption").textContent = sh.alt;
    const swap = () => { img.src = sh.src; img.alt = sh.alt; };
    if (this.gsap) this.gsap.timeline().to(img, { autoAlpha: 0, x: -20, duration: 0.15, onComplete: swap }).fromTo(img, { x: 30 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power3.out", clearProps: "transform,opacity,visibility" });
    else swap();
  },

  // ↗ marks links that leave the site in a new tab; it is the only arrow used on buttons
  links(p) {
    return (p.links || []).map(l => `<a class="btn-mini${l.primary ? " primary" : ""}" href="${this.esc(l.url)}" target="_blank" rel="noopener">${this.esc(l.label)} <span class="ext" aria-hidden="true">↗</span><span class="sr-only">(opens in a new tab)</span></a>`).join("");
  },

  renderFilters(cats, counts, active) {
    this.els.filters.innerHTML = cats.filter(c => c.id === "all" || counts[c.id]).map(c =>
      `<button class="chip" data-filter="${c.id}" aria-pressed="${c.id === active}">${c.label}<small>${counts[c.id] || 0}</small></button>`).join("");
  },
  setFilter(id) { this.els.filters.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.filter === id)); },

  // what a visitor can do with the project right now, read from its links
  status(p) {
    const l = (p.links || []).map(x => x.label.toLowerCase());
    return l.some(x => x.includes("live")) ? ["Live", "live"] : l.some(x => x.includes("download")) ? ["Download", "dl"]
      : l.length ? ["Source", "src"] : ["Soon", "soon"];
  },

  // Persona-style select screen: numbered list on the left, the selected project in a large panel on the right.
  renderProjectList(list) {
    const row = (p, idx) => {
      const [st, cls] = this.status(p);
      return `<li><button class="pj-item" data-idx="${idx}" data-cat="${p.cat}" aria-pressed="false" aria-controls="pj-detail" style="--pc:${p.color}">
        <span class="pj-num">${String(idx + 1).padStart(2, "0")}</span>
        <span class="pj-mini" aria-hidden="true">${p.shots ? `<img src="${this.esc(p.shots[0].src)}" alt="" width="1280" height="720" loading="lazy" decoding="async">` : ""}</span>
        <span class="pj-text"><span class="pj-title">${this.esc(this.nice(p.title))}</span><span class="pj-tag">${this.esc(p.tag)}</span></span>
        <span class="pj-st ${cls}">${st}</span></button></li>`;
    };
    const main = list.map((p, i) => [p, i]).filter(([p]) => p.cat !== "small"), small = list.map((p, i) => [p, i]).filter(([p]) => p.cat === "small");
    document.getElementById("pj-list").innerHTML =
      `<h3 class="pj-group" data-group="main">Projects <span class="count" id="feat-count">${main.length}</span></h3><ul>${main.map(([p, i]) => row(p, i)).join("")}</ul>` +
      `<h3 class="pj-group" data-group="small">Smaller builds</h3><ul>${small.map(([p, i]) => row(p, i)).join("")}</ul>`;
  },

  showProjectDetail(p, idx, cats, animate) {
    document.querySelectorAll(".pj-item").forEach(b => b.setAttribute("aria-pressed", +b.dataset.idx === idx));
    const d = document.getElementById("pj-detail"), [st, cls] = this.status(p);
    this.paint(d, p);
    d.innerHTML = `${this.media(p, idx + 1, p.cat === "small" ? p.tag : this.catLabel(cats, p.cat))}
      <div class="pj-body">
        <div class="tags"><span class="lang">${this.esc(p.tag)}</span>${p.year ? `<span class="year">${p.year}</span>` : ""}<span class="pj-st ${cls}">${st}</span></div>
        <h3 class="pj-h">${this.splitTitle(p.title)}</h3>
        <p class="m-lead">${this.esc(p.desc)}</p>
        ${p.highlights ? `<h4>Highlights</h4><ol class="hl-list">${p.highlights.map(h => `<li>${this.esc(h)}</li>`).join("")}</ol>` : ""}
        ${p.stack ? `<h4>Built with</h4><ul class="stack">${p.stack.map(x => `<li>${this.esc(x)}</li>`).join("")}</ul>` : ""}
        <div class="actions">${this.links(p) || '<span class="soon">Repo coming soon</span>'}</div>
      </div>`;
    if (animate && this.gsap) {
      this.gsap.fromTo(d.querySelector(".cover, .gallery"), { clipPath: "polygon(0 0,0 0,0 100%,0 100%)" }, { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", duration: 0.45, ease: "power3.out", clearProps: "clipPath" });
      this.gsap.fromTo(d.querySelectorAll(".pj-body > *"), { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: "power3.out", stagger: 0.035, clearProps: "transform,opacity,visibility" });
    }
  },

  applyFilter(id, animate) {
    const shown = [];
    document.querySelectorAll(".pj-item").forEach(b => {
      const show = id === "all" || b.dataset.cat === id;
      b.parentNode.hidden = !show; if (show) shown.push(b);
    });
    document.querySelectorAll(".pj-group").forEach(h => {
      const ul = h.nextElementSibling; h.hidden = ul.hidden = !ul.querySelector("li:not([hidden])");
    });
    const fc = document.getElementById("feat-count"); if (fc) fc.textContent = document.querySelectorAll('.pj-group[data-group=main] + ul li:not([hidden])').length;
    if (animate && this.gsap) this.gsap.fromTo(shown, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: "power3.out", stagger: 0.04, clearProps: "transform,opacity,visibility" });
    return shown.map(b => +b.dataset.idx);
  },

  // Repo cards reveal as they scroll into view inside the projects screen (GSAP ScrollTrigger batch).
  revealCards(cards) {
    const g = this.gsap; if (!g || !cards.length) return;
    g.set(cards, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(cards, {
      scroller: this.els.screens.projects, start: "top 94%", once: true,
      onEnter: batch => g.to(batch, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.09, overwrite: true, clearProps: "transform,opacity,visibility" }),
    });
    ScrollTrigger.refresh();
  },

  repoLoading() {
    this.els.repoStatus.textContent = "Loading repositories from GitHub…";
    this.els.repoGrid.innerHTML = '<div class="card sk" aria-hidden="true"></div>'.repeat(3);
  },

  repoError() {
    this.els.repoGrid.innerHTML = "";
    this.els.repoStatus.innerHTML = `<span>GitHub didn't answer (it may be rate-limiting this network). Everything above is still here.</span><button class="btn-mini" data-retry>Try again</button>`;
  },

  ago(iso) {
    const d = (Date.now() - new Date(iso)) / 864e5;
    return d < 1 ? "today" : d < 2 ? "yesterday" : d < 30 ? `${Math.floor(d)} days ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
  },

  renderRepos(repos, model) {
    this.els.repoStatus.textContent = repos.length
      ? `${repos.length} more public ${repos.length === 1 ? "repository" : "repositories"}, live from GitHub.`
      : "Every public repository is already featured above. New ones will show up here automatically.";
    this.els.repoGrid.innerHTML = "";
    const cards = repos.map((r, i) => {
      const el = document.createElement("article"), color = model.langColors[r.language] || "#e60012";
      el.className = "card"; el.style.setProperty("--pc", color);
      el.style.setProperty("--tilt", ((this.hash(r.name) % 5) - 2) * 0.4 + "deg");
      const pretty = r.name.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, c => c.toUpperCase());
      el.innerHTML = `${this.cover({ title: pretty.toUpperCase() }, i + 1, r.language || "Repo")}
        <div class="card-body">
          <div class="tags"><span class="lang">${this.esc(r.language || "Repo")}</span></div>
          <h4 class="card-title">${this.splitTitle(pretty)}</h4>
          <p>${this.esc(r.description || "No description on GitHub yet.")}</p>
          <div class="actions"><span class="repo-meta"><span>★ ${r.stargazers_count || 0}<span class="sr-only"> stars</span></span><span>${r.pushed_at ? "Updated " + this.ago(r.pushed_at) : ""}</span></span>
          ${r.homepage ? `<a class="btn-mini" href="${this.esc(r.homepage)}" target="_blank" rel="noopener">Live <span class="ext" aria-hidden="true">↗</span><span class="sr-only">(opens in a new tab)</span></a>` : ""}
          <a class="btn-mini primary" href="${this.esc(r.html_url)}" target="_blank" rel="noopener">Code <span class="ext" aria-hidden="true">↗</span><span class="sr-only">(opens in a new tab)</span></a></div>
        </div>`;
      this.els.repoGrid.appendChild(el);
      return el;
    });
    this.revealCards(cards);
  },

  /* ---------- project modal ---------- */
  renderModal(p, idx, pos, total, cats, swap) {
    const b = this.els.modalBody;
    this.paint(this.els.modalPanel, p);
    const label = p.cat === "small" ? p.tag : this.catLabel(cats, p.cat);
    b.innerHTML = `${this.media(p, idx + 1, label).replace('class="cover"', 'class="cover m-cover"')}
      <div class="m-body${swap ? " swap" : ""}">
        <div class="tags"><span class="lang">${this.esc(p.tag)}</span>${p.year ? `<span class="year">${p.year}</span>` : ""}</div>
        <h2 id="m-title">${this.splitTitle(p.title)}</h2>
        <p class="m-lead">${this.esc(p.desc)}</p>
        ${p.highlights ? `<h3>Highlights</h3><ol class="hl-list">${p.highlights.map(h => `<li>${this.esc(h)}</li>`).join("")}</ol>` : ""}
        ${p.stack ? `<h3>Built with</h3><ul class="stack">${p.stack.map(s => `<li>${this.esc(s)}</li>`).join("")}</ul>` : ""}
        <div class="actions">${this.links(p) || '<span class="soon">Repo coming soon</span>'}</div>
        <div class="m-nav"><button class="btn-mini" data-step="-1">← Previous</button><span>${pos + 1} / ${total}</span><button class="btn-mini" data-step="1">Next →</button></div>
      </div>`;
    b.querySelectorAll(".m-body > *").forEach((e, i) => e.style.setProperty("--i", i));
    b.scrollTop = 0;
  },

  openOverlay(el, focusEl) {
    el.hidden = false; void el.offsetWidth; el.classList.add("open");
    if (!el._held) { el._held = true; window.BGFX && BGFX.hold(true); }   // the wallpaper is covered, so stop painting it
    (focusEl || el.querySelector("[tabindex='-1']")).focus({ preventScroll: true });
  },
  closeOverlay(el) {
    el.classList.remove("open");
    if (el._held) { el._held = false; window.BGFX && BGFX.hold(false); }
    setTimeout(() => { if (!el.classList.contains("open")) el.hidden = true; }, this.reduced ? 0 : 450);
  },

  /* ---------- quick jump palette ---------- */
  renderPalette(items, sel) {
    const L = this.els.paletteList;
    if (!items.length) { L.innerHTML = '<li class="none" role="option" aria-disabled="true">Nothing matches. Try a project name, "cv" or "sound".</li>'; this.els.paletteInput.removeAttribute("aria-activedescendant"); return; }
    L.innerHTML = items.map((it, i) => `<li id="pal-${i}" role="option" data-i="${i}" aria-selected="${i === sel}" style="--pc:${it.color || "var(--red)"}"><i aria-hidden="true"></i>${this.esc(it.label)}<small>${this.esc(it.kind)}</small></li>`).join("");
    this.els.paletteInput.setAttribute("aria-activedescendant", "pal-" + sel);
    L.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  },

  /* ---------- skills: hexagon chart + ranked list + detail ---------- */
  nice: t => t.toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase()),
  pips: (r, label) => `<span class="pips" role="img" aria-label="Rank ${r} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= r ? "f" : ""}"></i>`).join("")}</span>`,
  skR: [0, 0, 0, 0, 0, 0],

  renderSkillTabs(groups) {
    document.getElementById("sk-groups").innerHTML = groups.map((g, i) =>
      `<button class="sk-tab" role="tab" id="sk-tab-${i}" aria-controls="sk-panel" aria-selected="false" tabindex="-1" data-group="${i}"><small>0${i + 1}</small>${this.esc(g.group)}</button>`).join("");
  },

  // point i of the hexagon at radius r (0..100); first axis points straight up
  hexPt(i, r, n = 6) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * r, Math.sin(a) * r]; },

  drawRadarFrame(items) {
    const svg = document.getElementById("sk-radar"), n = items.length;
    const ring = r => Array.from({ length: n }, (_, i) => this.hexPt(i, r, n).map(v => v.toFixed(1)).join(",")).join(" ");
    let h = `<title id="sk-radar-title"></title>`;
    [25, 50, 75].forEach(r => (h += `<polygon class="ring" points="${ring(r)}"/>`));
    h += `<polygon class="ring outer" points="${ring(100)}"/>`;
    for (let i = 0; i < n; i++) { const [x, y] = this.hexPt(i, 100, n); h += `<line class="axis" x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }
    h += `<polygon class="shape" id="sk-shape" points="${ring(0)}"/>`;
    items.forEach((it, i) => {
      const [x, y] = this.hexPt(i, 116, n), anchor = Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end";
      h += `<circle class="dot" data-si="${i}" r="5" cx="0" cy="0"/><text data-si="${i}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${this.esc(it.short)}</text>`;
    });
    svg.innerHTML = h;
    svg.querySelector("title").textContent = items.map(it => `${it.name} ${it.v}`).join(", ");
  },

  setRadar(vals) {
    this.skR = vals.slice();
    const pts = vals.map((v, i) => this.hexPt(i, v));
    document.getElementById("sk-shape")?.setAttribute("points", pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" "));
    document.querySelectorAll("#sk-radar .dot").forEach((d, i) => { d.setAttribute("cx", pts[i][0].toFixed(1)); d.setAttribute("cy", pts[i][1].toFixed(1)); });
  },

  // morph the hexagon to the new group's values (from the centre on first show)
  morphRadar(vals, fromZero) {
    const start = fromZero ? vals.map(() => 0) : this.skR.slice();
    if (!this.gsap) { this.setRadar(vals); return; }
    const o = { k: 0 };
    this.gsap.killTweensOf(this.skTween || {});
    this.skTween = o;
    this.gsap.to(o, { k: 1, duration: fromZero ? 0.9 : 0.55, delay: fromZero ? 0.35 : 0, ease: fromZero ? "back.out(1.3)" : "power3.out",
      onUpdate: () => this.setRadar(start.map((s0, i) => s0 + (vals[i] - s0) * o.k)) });
  },

  showSkillGroup(groups, gi, si, opts = {}) {
    const g = groups[gi];
    document.querySelectorAll(".sk-tab").forEach((t, i) => { t.setAttribute("aria-selected", i === gi); t.tabIndex = i === gi ? 0 : -1; });
    document.getElementById("sk-panel").setAttribute("aria-labelledby", "sk-tab-" + gi);
    document.querySelector(".sk-chart").dataset.blurb = g.blurb;
    this.drawRadarFrame(g.items);
    document.getElementById("sk-list").innerHTML = g.items.map((it, i) => {
      const r = this.rankOf(it.v);
      return `<li><button class="sk-item" data-si="${i}" aria-pressed="false">${this.pips(r)}<span class="sk-name">${this.esc(it.name)}</span><span class="sk-bar" aria-hidden="true"><i style="--v:${it.v}%"></i></span><span class="sk-v"><span class="sr-only">level </span>${it.v}</span></button></li>`;
    }).join("");
    this.morphRadar(g.items.map(it => it.v), opts.fromZero);
    if (this.gsap) this.gsap.fromTo("#sk-list .sk-item", { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out", stagger: 0.045, delay: opts.fromZero ? 0.3 : 0, clearProps: "transform,opacity,visibility" });
    if (this.gsap) this.gsap.fromTo("#sk-list .sk-bar i", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power3.out", stagger: 0.045, delay: opts.fromZero ? 0.4 : 0.1 });
    this.showSkill(g, si);
  },

  showSkill(g, si) {
    const it = g.items[si], r = this.rankOf(it.v), P = this.skProjects;
    document.querySelectorAll(".sk-item").forEach((b, i) => b.setAttribute("aria-pressed", i === si));
    document.querySelectorAll("#sk-radar [data-si]").forEach(el => el.classList.toggle("on", +el.dataset.si === si));
    const used = it.uses.map(id => P[id]).filter(Boolean);
    document.getElementById("sk-detail").innerHTML = `<h3>${this.esc(it.name)}</h3>
      <div class="sk-meta">${this.pips(r)}<span>Rank ${r}</span><span>${it.v} / 100</span></div>
      ${used.length ? `<div class="sk-used"><span>Used in</span>${used.map(u => `<button data-project="${u.i}" style="--pc:${u.p.color}" class="${u.p.ink ? "" : "dark"}">${this.esc(this.nice(u.p.title))}</button>`).join("")}</div>`
        : `<p class="sk-none">Not tied to a project on this site yet.</p>`}`;
  },

  rankOf: v => (v >= 80 ? 5 : v >= 70 ? 4 : v >= 60 ? 3 : v >= 50 ? 2 : 1),

  /* ---------- about ---------- */
  renderAbout(chapters, traits) {
    let first = true, html = "";
    chapters.forEach((ch, ci) => {
      html += `<section class="chapter ${ci % 2 ? "from-right" : "from-left"}"><h3>${this.esc(ch.h)}</h3>`;
      ch.items.forEach(it => {
        html += typeof it === "string"
          ? `<p class="sr${first ? " lead" : ""}">${this.md(it)}</p>`
          : `<blockquote class="quote sr"><p>${this.esc(it.quote)}</p><small>${this.esc(it.by)}</small></blockquote>`;
        first = false;
      });
      html += "</section>";
    });
    this.els.aboutBody.innerHTML = html;
    document.getElementById("traits").innerHTML = traits.map(t =>
      `<li class="trait sr"><span class="t-n" aria-hidden="true">${t.n}</span><h4>${this.esc(t.name)}</h4><p>${this.esc(t.line)}</p></li>`).join("");
  },

  /* ---------- ambient: clock, parallax, cursor, card tilt ---------- */
  startClock() {
    const tick = () => { const d = new Date(); this.els.clock.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); this.renderCalendar(d); };
    tick(); setInterval(tick, 15000);
  },

  startParallax() {
    if (this.reduced) return;
    const st = document.getElementById("bg-stripes"), ht = document.getElementById("bg-halftone");
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, last = 0;
    // easing is based on elapsed time, so it feels the same on 60, 120 and 240 Hz screens
    const loop = ts => {
      const dt = Math.min(ts - (last || ts), 50); last = ts;
      const k = 1 - Math.exp(-dt / 260);
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      st.style.transform = `translate3d(${cx * 22}px,${cy * 14}px,0)`;
      ht.style.transform = `translate3d(${cx * -34}px,${cy * -22}px,0)`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(loop); else { raf = 0; last = 0; }   // idle when the pointer stops
    };
    addEventListener("mousemove", e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  },

  // Sprite cursor that follows the pointer, with a trail of diamonds, a ring that opens on links, and a burst of slashes on click.
  // Everything is driven by real elapsed time so it stays smooth and identical at any refresh rate.
  startCursor() {
    if (!matchMedia("(pointer:fine)").matches || this.reduced) return;
    const cur = this.els.cursor;
    document.body.classList.add("cursor-on");
    const N = 9, trail = [], layer = document.createElement("div");
    layer.id = "cursor-fx"; layer.setAttribute("aria-hidden", "true");
    const ring = document.createElement("i"); ring.className = "c-ring"; layer.appendChild(ring);
    for (let i = 0; i < N; i++) { const d = document.createElement("i"); d.className = "c-dot" + (i % 3 === 1 ? " alt" : ""); layer.appendChild(d); trail.push({ el: d, x: -100, y: -100 }); }
    document.body.appendChild(layer);
    let x = -100, y = -100, px = -100, py = -100, frame = 0, acc = 0, vis = false, link = false, speed = 0, lastT = 0, hx = 6, hy = 4;
    const hotspot = () => { const cs = getComputedStyle(cur); hx = parseFloat(cs.getPropertyValue("--hx")) || 6; hy = parseFloat(cs.getPropertyValue("--hy")) || 4; };
    this.refreshCursor = () => requestAnimationFrame(hotspot);
    addEventListener("mousemove", e => {
      x = e.clientX; y = e.clientY;
      if (!vis) { px = x; py = y; trail.forEach(t => { t.x = x; t.y = y; }); cur.style.display = "block"; layer.style.display = "block"; vis = true; }
      link = !!e.target.closest?.("a,button,.card.clickable,.menu-item,input,textarea,[data-close],#palette-list li,.pj-item,.sk-row");
      if (link !== cur.classList.contains("link")) { cur.classList.toggle("link", link); ring.classList.toggle("open", link); hotspot(); }
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { cur.style.display = "none"; layer.style.display = "none"; vis = false; });
    addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse") return;
      ring.classList.add("press");
      for (let i = 0; i < 8; i++) {
        const b = document.createElement("i"); b.className = "c-burst" + (i % 2 ? " alt" : "");
        const a = (i / 8) * Math.PI * 2 + Math.random() * .4, d = 26 + Math.random() * 26;
        b.style.left = e.clientX + "px"; b.style.top = e.clientY + "px"; b.style.rotate = a + "rad";
        layer.appendChild(b);
        b.animate([{ transform: "translate(-50%,-50%) translateX(6px) scaleX(.4)", opacity: 1 }, { transform: `translate(-50%,-50%) translateX(${d}px) scaleX(1.4)`, opacity: 0 }],
          { duration: 420 + Math.random() * 120, easing: "cubic-bezier(.2,.8,.2,1)" }).finished.then(() => b.remove(), () => b.remove());
      }
    }, { passive: true });
    addEventListener("pointerup", () => ring.classList.remove("press"), { passive: true });
    const tick = ts => {
      const dt = Math.min(ts - (lastT || ts), 50); lastT = ts;
      if (vis) {
        acc += dt; if (acc >= 50) { frame = (frame + Math.floor(acc / 50)) % 30; acc %= 50; cur.style.backgroundPosition = -frame * 48 + "px 0"; }
        const k = 1 - Math.exp(-dt / 28);               // the sprite eases after the pointer
        const ox = px, oy = py; px += (x - px) * k; py += (y - py) * k;
        speed += (Math.hypot(px - ox, py - oy) / Math.max(dt, 1) * 16 - speed) * (1 - Math.exp(-dt / 90));
        cur.style.transform = `translate3d(${px - hx}px,${py - hy}px,0)`;
        ring.style.transform = `translate3d(${px}px,${py}px,0) translate(-50%,-50%)`;
        let tx = px, ty = py;
        trail.forEach((t, i) => {                       // each dot chases the one in front, so they stream out behind a fast cursor
          const f = 1 - Math.exp(-dt / (34 + i * 9));
          t.x += (tx - t.x) * f; t.y += (ty - t.y) * f; tx = t.x; ty = t.y;
          const sc = Math.max(0, 1 - i / N) * Math.min(1, speed / 6);
          t.el.style.transform = `translate3d(${t.x}px,${t.y}px,0) translate(-50%,-50%) rotate(45deg) scale(${sc})`;
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  startTilt() {
    if (this.reduced || !matchMedia("(pointer:fine)").matches) return;
    const grid = this.els.screens.projects;
    grid.addEventListener("pointermove", e => {
      const c = e.target.closest(".card"); if (!c || c.classList.contains("flagship")) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 7 + "deg");
      c.style.setProperty("--rx", -((e.clientY - r.top) / r.height - 0.5) * 7 + "deg");
    });
    grid.addEventListener("pointerout", e => {
      const c = e.target.closest(".card");
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); }
    });
  },
};
