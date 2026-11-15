/* VIEW — everything that draws. No app logic. */
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
      featGrid: $("#feat-grid"), smallGrid: $("#small-grid"), repoGrid: $("#repo-grid"), repoStatus: $("#repo-status"),
      filters: $("#filters"), featCount: $("#feat-count"),
      skillsBody: $("#skills-body"), aboutBody: $("#about-body"), sfx: $("#sfx-select"),
      cursor: $("#cursor"), clock: $("#clock"), caption: $("#menu-caption span"),
      progress: $("#progress"), toTop: $("#to-top"), toast: $("#toast"),
      modal: $("#modal"), modalPanel: $("#modal .modal-panel"), modalBody: $("#modal-body"),
      help: $("#help"), soundBtn: $("#sound-toggle"),
    });
    document.querySelectorAll(".screen").forEach(s => (this.els.screens[s.id.replace("screen-", "")] = s));
    this.els.menuItems = [...document.querySelectorAll(".menu-item")];
    this.els.tabs = [...document.querySelectorAll(".tab")];
    this.els.menuItems.forEach((m, i) => m.style.setProperty("--m", i));
    document.querySelectorAll("[data-ransom]").forEach(el => this.ransomize(el));
    this.els.sfx.volume = 0.4;
    this.startClock(); this.startParallax(); this.startCursor(); this.startTilt();
  },

  hash(str) { let h = 9; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 387420489); return (h ^ (h >>> 9)) >>> 0; },
  esc: s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  md: s => s.replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>'),

  /* ---------- ransom-note lettering ---------- */
  ransomize(el, text = el.dataset.ransom) {
    const forced = this.forceBox[text] || [];
    el.textContent = "";
    el.setAttribute("aria-label", text);
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

  // Three skewed panes sweep across with the destination's name; swap() runs while the screen is fully covered.
  // dir = 1 sweeps left→right, -1 right→left (used when going back through the tabs).
  wipe(label, kicker, dir, swap, done) {
    if (this.reduced) { swap(); done(); return; }
    const w = this.els.wipe, panes = [...w.querySelectorAll(".pane")], lab = w.querySelector(".wipe-label");
    this.ransomize(this.els.wipeText, label); this.els.wipeKicker.textContent = kicker;
    const T = x => `translateX(${x * dir}%) skewX(-14deg)`;
    const opt = (d, i) => ({ duration: d, delay: i * 60, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" });
    w.style.display = "block";
    lab.animate([{ opacity: 0, transform: `translateX(${-60 * dir}px) skewX(-8deg)` }, { opacity: 1, transform: "none" }], { duration: 320, delay: 260, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    Promise.all(panes.map((p, i) => p.animate([{ transform: T(-130) }, { transform: T(0) }], opt(420, i)).finished))
      .then(() => new Promise(r => setTimeout(r, 170)))
      .then(() => {
        swap();
        lab.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${80 * dir}px)` }], { duration: 240, easing: "ease-in", fill: "both" });
        return Promise.all(panes.map((p, i) => p.animate([{ transform: T(0) }, { transform: T(130) }], opt(480, 2 - i)).finished));
      })
      .then(() => { w.style.display = "none"; [...panes, lab].forEach(p => p.getAnimations().forEach(a => a.cancel())); done(); });
  },

  // First paint: the panes start covering the screen and slide away.
  boot(done) {
    const body = document.body;
    if (this.reduced) { body.classList.remove("booting"); done(); return; }
    const w = this.els.wipe, panes = [...w.querySelectorAll(".pane")], lab = w.querySelector(".wipe-label");
    this.ransomize(this.els.wipeText, "TAKE YOUR TIME"); this.els.wipeKicker.textContent = "Welcome";
    lab.animate([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    setTimeout(() => {
      lab.animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(80px)" }], { duration: 260, easing: "ease-in", fill: "both" });
      w.style.display = "block"; body.classList.remove("booting");
      Promise.all(panes.map((p, i) => p.animate([{ transform: "translateX(0) skewX(-14deg)" }, { transform: "translateX(130%) skewX(-14deg)" }], { duration: 560, delay: (2 - i) * 70, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" }).finished))
        .then(() => { w.style.display = "none"; [...panes, lab].forEach(p => p.getAnimations().forEach(a => a.cancel())); done(); });
    }, 850);
  },

  playSelect() { try { this.els.sfx.currentTime = 0; const p = this.els.sfx.play(); p && p.catch && p.catch(() => {}); } catch {} },
  setSound(on) { this.els.soundBtn.setAttribute("aria-pressed", on); },

  toast(msg) {
    const t = this.els.toast; t.textContent = msg; t.classList.add("show");
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  },

  /* ---------- projects ---------- */
  splitTitle(t) { const e = this.esc(t), f = e.split(" ")[0]; return `<em>${f}</em>${e.slice(f.length)}`; },
  catLabel(cats, id) { return (cats.find(c => c.id === id) || {}).label || id; },

  cover(p, n, label) {
    if (p.img) return `<div class="thumb"><img src="${this.esc(p.img)}" alt="" loading="lazy" onerror="this.parentNode.remove()"></div>`;
    return `<div class="cover" aria-hidden="true"><span class="cover-cat">${this.esc(label)}</span><span class="cover-num">${String(n).padStart(2, "0")}</span><span class="cover-word">${this.esc(p.cover || p.title.split(" ")[0])}</span></div>`;
  },
  links(p) {
    return (p.links || []).map(l => `<a class="btn-mini${l.primary ? " primary" : ""}" href="${this.esc(l.url)}" target="_blank" rel="noopener">${this.esc(l.label)} ↗</a>`).join("");
  },

  renderFilters(cats, counts, active) {
    this.els.filters.innerHTML = cats.filter(c => c.id === "all" || counts[c.id]).map(c =>
      `<button class="chip" data-filter="${c.id}" aria-pressed="${c.id === active}">${c.label}<small>${counts[c.id] || 0}</small></button>`).join("");
  },
  setFilter(id) { this.els.filters.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.filter === id)); },

  renderProjects(list, cats) {
    let n = 0;
    list.forEach((p, idx) => {
      const small = p.cat === "small", el = document.createElement("article");
      el.className = "card reveal" + (p.highlights ? " clickable" : "");
      el.dataset.cat = p.cat; el.dataset.idx = idx;
      el.style.setProperty("--pc", p.color);
      el.style.setProperty("--tilt", ((this.hash(p.title) % 5) - 2) * 0.4 + "deg");
      el.style.setProperty("--i", Math.min(n++, 10));
      el.innerHTML = `${this.cover(p, idx + 1, small ? p.tag : this.catLabel(cats, p.cat))}
        <div class="card-body">
          <div class="tags"><span class="lang">${this.esc(p.tag)}</span>${p.year ? `<span class="year">${p.year}</span>` : ""}</div>
          <h3>${this.splitTitle(p.title)}</h3>
          <p>${this.esc(p.desc)}</p>
          ${p.stack && !small ? `<ul class="stack">${p.stack.slice(0, 4).map(s => `<li>${this.esc(s)}</li>`).join("")}${p.stack.length > 4 ? `<li>+${p.stack.length - 4}</li>` : ""}</ul>` : ""}
          <div class="actions">${p.highlights ? `<button class="btn-mini" data-open="${idx}">Details</button>` : ""}${this.links(p)}${p.links && p.links.length ? "" : '<span class="soon">Repo coming soon</span>'}</div>
        </div>`;
      (small ? this.els.smallGrid : this.els.featGrid).appendChild(el);
    });
  },

  // hide/show cards for a filter and replay a quick stagger on what's left
  applyFilter(id) {
    let k = 0;
    document.querySelectorAll("#feat-grid .card, #small-grid .card").forEach(c => {
      const show = id === "all" || c.dataset.cat === id;
      c.classList.toggle("out", !show); c.classList.remove("in");
      if (show && !this.reduced) { c.style.setProperty("--k", k++); void c.offsetWidth; c.classList.add("in"); }
    });
    ["main", "small"].forEach(g => {
      const grid = g === "main" ? this.els.featGrid : this.els.smallGrid, label = document.querySelector(`.grid-label[data-group=${g}]`);
      label.hidden = !grid.querySelector(".card:not(.out)");
    });
    this.els.featCount.textContent = this.els.featGrid.querySelectorAll(".card:not(.out)").length;
  },

  skeletons() { this.els.repoGrid.innerHTML = '<div class="card sk"></div>'.repeat(3); },

  ago(iso) {
    const d = (Date.now() - new Date(iso)) / 864e5;
    return d < 1 ? "today" : d < 2 ? "yesterday" : d < 30 ? `${Math.floor(d)} days ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
  },

  renderRepos(repos, status, model) {
    this.els.repoStatus.textContent = status;
    this.els.repoGrid.innerHTML = "";
    repos.forEach((r, i) => {
      const el = document.createElement("article"), color = model.langColors[r.language] || "#e60012";
      el.className = "card reveal in"; el.style.setProperty("--pc", color); el.style.setProperty("--k", i);
      el.style.setProperty("--tilt", ((this.hash(r.name) % 5) - 2) * 0.4 + "deg");
      const pretty = r.name.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, c => c.toUpperCase());
      el.innerHTML = `${this.cover({ title: pretty.toUpperCase() }, i + 1, r.language || "Repo")}
        <div class="card-body">
          <div class="tags"><span class="lang">${this.esc(r.language || "Repo")}</span></div>
          <h3>${this.splitTitle(pretty)}</h3>
          <p>${this.esc(r.description || "No description yet, but the code speaks for itself.")}</p>
          <div class="actions"><span class="repo-meta"><span>★ ${r.stargazers_count || 0}</span><span>${r.pushed_at ? "Updated " + this.ago(r.pushed_at) : ""}</span></span>
          ${r.homepage ? `<a class="btn-mini" href="${this.esc(r.homepage)}" target="_blank" rel="noopener">Live ↗</a>` : ""}
          <a class="btn-mini primary" href="${this.esc(r.html_url)}" target="_blank" rel="noopener">Code ↗</a></div>
        </div>`;
      this.els.repoGrid.appendChild(el);
    });
  },

  /* ---------- project modal ---------- */
  renderModal(p, idx, total, cats, swap) {
    const b = this.els.modalBody;
    this.els.modalPanel.style.setProperty("--pc", p.color);
    b.innerHTML = `${this.cover(p, idx + 1, this.catLabel(cats, p.cat)).replace('class="cover"', 'class="cover m-cover"')}
      <div class="m-body${swap ? " swap" : ""}">
        <div class="tags"><span class="lang">${this.esc(p.tag)}</span>${p.year ? `<span class="year">${p.year}</span>` : ""}</div>
        <h2 id="m-title">${this.splitTitle(p.title)}</h2>
        <p class="m-lead">${this.esc(p.desc)}</p>
        ${p.highlights ? `<h4>Highlights</h4><ul class="hl-list">${p.highlights.map(h => `<li>${this.esc(h)}</li>`).join("")}</ul>` : ""}
        ${p.stack ? `<h4>Built with</h4><ul class="stack">${p.stack.map(s => `<li>${this.esc(s)}</li>`).join("")}</ul>` : ""}
        <div class="actions">${this.links(p)}</div>
        <div class="m-nav"><button class="btn-mini" data-step="-1">← Prev</button><span>${idx + 1} / ${total}</span><button class="btn-mini" data-step="1">Next →</button></div>
      </div>`;
    b.querySelectorAll(".m-body > *").forEach((e, i) => e.style.setProperty("--i", i));
    b.scrollTop = 0;
  },

  openOverlay(el, focusEl) {
    el.hidden = false; void el.offsetWidth; el.classList.add("open");
    (focusEl || el.querySelector("[tabindex='-1']")).focus({ preventScroll: true });
  },
  closeOverlay(el) {
    el.classList.remove("open");
    setTimeout(() => { if (!el.classList.contains("open")) el.hidden = true; }, this.reduced ? 0 : 450);
  },

  /* ---------- skills ---------- */
  renderSkills(groups) {
    groups.forEach(g => {
      const d = document.createElement("div");
      d.className = "skill-group reveal";
      d.innerHTML = `<h3>${this.esc(g.group)}</h3>` + g.items.map(([n, v]) =>
        `<div class="skill-row"><span>${this.esc(n)}</span><div class="skill-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}" aria-label="${this.esc(n)}"><div class="fill" data-v="${v}"></div></div><span class="lv">0</span></div>`).join("");
      this.els.skillsBody.appendChild(d);
    });
  },

  animateSkillBars() {
    this.els.skillsBody.querySelectorAll(".skill-row").forEach((r, i) => {
      const f = r.querySelector(".fill"), lv = r.querySelector(".lv"), v = +f.dataset.v;
      if (this.reduced) { f.style.width = v + "%"; lv.textContent = v; return; }
      f.style.transition = "none"; f.style.width = "0"; lv.textContent = "0"; void f.offsetWidth; f.style.transition = "";
      setTimeout(() => { f.style.width = v + "%"; this.count(lv, v, 1000); }, 600 + i * 55);
    });
  },
  count(el, to, ms) {
    const t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  },

  /* ---------- about ---------- */
  renderAbout(items) {
    let html = `<figure class="about-photo"><img src="assets/me.jpg" alt="Profile photo" onerror="this.closest('figure').remove()"><figcaption>CLOUD ENGINEERING / IT</figcaption></figure>`;
    items.forEach((it, i) => {
      html += typeof it === "string"
        ? `<p class="sr${i === 0 ? " lead" : ""}">${this.md(it)}</p>`
        : `<p class="about-quote sr">“${it.quote}”<small>— ${it.by}</small></p>`;
    });
    this.els.aboutBody.innerHTML = html;
  },

  /* ---------- ambient: clock, parallax, cursor, card tilt ---------- */
  startClock() {
    const tick = () => (this.els.clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick(); setInterval(tick, 10000);
  },

  startParallax() {
    if (this.reduced) return;
    const st = document.getElementById("bg-stripes"), ht = document.getElementById("bg-halftone");
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("mousemove", e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      st.style.transform = `translate3d(${cx * 22}px,${cy * 14}px,0)`;
      ht.style.transform = `translate3d(${cx * -34}px,${cy * -22}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
  },

  // 30-frame sprite cursor that eases after the pointer
  startCursor() {
    if (!matchMedia("(pointer:fine)").matches || this.reduced) return;
    const cur = this.els.cursor;
    document.body.classList.add("cursor-on");
    let x = -100, y = -100, px = -100, py = -100, frame = 0, last = 0, vis = false;
    addEventListener("mousemove", e => {
      x = e.clientX; y = e.clientY;
      if (!vis) { px = x; py = y; cur.style.display = "block"; vis = true; }
      cur.classList.toggle("link", !!e.target.closest?.("a,button,.card.clickable,.menu-item,#big-name,input,textarea,[data-close]"));
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { cur.style.display = "none"; vis = false; });
    const tick = ts => {
      if (ts - last >= 50) { frame = (frame + 1) % 30; last = ts; cur.style.backgroundPosition = -frame * 48 + "px 0"; }
      px += (x - px) * 0.4; py += (y - py) * 0.4;
      cur.style.transform = `translate3d(${px - 6}px,${py - 4}px,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  startTilt() {
    if (this.reduced || !matchMedia("(pointer:fine)").matches) return;
    const grid = this.els.screens.projects;
    grid.addEventListener("pointermove", e => {
      const c = e.target.closest(".card"); if (!c) return;
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
