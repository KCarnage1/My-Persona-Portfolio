/* VIEW — everything that draws. No app logic. */
const View = {
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  forceBox: { CLOUD: ["O"], IT: ["T"] },
  els: { screens: {}, menuItems: [] },
  io: null,

  init() {
    const $ = s => document.querySelector(s);
    Object.assign(this.els, {
      wipe: $("#wipe"), featGrid: $("#feat-grid"), repoGrid: $("#repo-grid"), repoStatus: $("#repo-status"),
      skillsBody: $("#skills-body"), aboutBody: $("#about-body"), sfx: $("#sfx-select"),
      cursor: $("#cursor"), clock: $("#clock"), video: $("#home-video"),
    });
    document.querySelectorAll(".screen").forEach(s => (this.els.screens[s.id.replace("screen-", "")] = s));
    this.els.menuItems = [...document.querySelectorAll(".menu-item")];
    this.els.menuItems.forEach((m, i) => m.style.setProperty("--m", i));
    document.querySelectorAll("[data-ransom]").forEach(el => this.ransomize(el));
    this.els.sfx.volume = 0.45;
    this.startClock(); this.startParallax(); this.startCursor(); this.startTilt();
  },

  hash(str) { let h = 9; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 387420489); return (h ^ (h >>> 9)) >>> 0; },
  md: s => s.replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>'),

  /* ---------- ransom-note lettering ---------- */
  ransomize(el) {
    const text = el.dataset.ransom, forced = this.forceBox[text] || [];
    el.textContent = "";
    [...text].forEach((c, i) => {
      const s = document.createElement("span"), h = this.hash(text + i);
      s.className = "ch"; s.textContent = c; s.style.setProperty("--i", i);
      s.style.setProperty("--t", `rotate(${(h % 17) - 8}deg) scale(${0.86 + ((h >> 3) % 30) / 100}) translateY(${((h >> 5) % 9) - 4}px)`);
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
    document.querySelectorAll(".menu-art").forEach(a => a.classList.toggle("on", a.id === "art-" + name));
    const v = this.els.video; if (v) name === "home" ? v.play().catch(() => {}) : v.pause();
    const sk = document.getElementById("art-skills"); if (sk && sk.pause) name === "skills" ? sk.play().catch(() => {}) : sk.pause();
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

  setMenuSelection(i) { this.els.menuItems.forEach((m, j) => m.classList.toggle("sel", j === i)); },

  // Three skewed panes sweep across; swap() runs while the screen is fully covered
  wipe(swap, done) {
    if (this.reduced) { swap(); done(); return; }
    const w = this.els.wipe, panes = [...w.querySelectorAll(".pane")];
    const T = x => `translateX(${x}%) skewX(-14deg)`;
    const opt = (d, i) => ({ duration: d, delay: i * 70, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" });
    w.style.display = "block";
    Promise.all(panes.map((p, i) => p.animate([{ transform: T(-130) }, { transform: T(0) }], opt(450, i)).finished))
      .then(() => { swap(); return Promise.all(panes.map((p, i) => p.animate([{ transform: T(0) }, { transform: T(130) }], opt(520, i)).finished)); })
      .then(() => { w.style.display = "none"; panes.forEach(p => p.getAnimations().forEach(a => a.cancel())); done(); });
  },

  playSelect() { try { this.els.sfx.currentTime = 0; const p = this.els.sfx.play(); p && p.catch && p.catch(() => {}); } catch {} },

  /* ---------- projects ---------- */
  thumb(src, og) { return `<div class="thumb"><img src="${src}" alt="" loading="lazy" data-og="${og || ""}" onerror="View.thumbFail(this)"></div>`; },
  // local image missing → try GitHub's auto-generated social preview → give up quietly
  thumbFail(img) { if (img.dataset.og) { const o = img.dataset.og; img.dataset.og = ""; img.src = o; } else img.closest(".thumb")?.remove(); },
  splitTitle(t) { const f = t.split(" ")[0]; return `<em>${f}</em>${t.slice(f.length)}`; },

  card(href, i, title, extra) {
    const a = document.createElement("a");
    a.className = "card reveal"; a.href = href; a.target = "_blank"; a.rel = "noopener";
    a.style.setProperty("--tilt", ((this.hash(title) % 5) - 2) * 0.6 + "deg");
    a.style.setProperty("--i", Math.min(i, 10));
    return a;
  },

  renderFeatured(list) {
    if (this.els.featGrid.childElementCount) return;
    list.forEach((f, i) => {
      const a = this.card(f.url, i, f.title);
      a.innerHTML = `${this.thumb(f.img)}<span class="lang" style="--lc:${f.color}">${f.tag}</span>
        <h3>${this.splitTitle(f.title)}</h3><p>${f.desc}</p>
        <div class="meta"><span>HIGHLIGHT</span><span class="go">${f.cta}</span></div>`;
      this.els.featGrid.appendChild(a);
    });
  },

  skeletons() { this.els.repoGrid.innerHTML = '<div class="card sk"></div>'.repeat(3); },

  renderRepos(repos, status, model) {
    this.els.repoStatus.textContent = status;
    this.els.repoGrid.innerHTML = "";
    repos.forEach((r, i) => {
      const a = this.card(r.html_url, i, r.name);
      a.style.setProperty("--lc", model.langColors[r.language] || "#e60012");
      const pretty = r.name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const img = model.projectImages[r.name] || `assets/projects/${r.name}.png`;
      a.innerHTML = `${this.thumb(img, `https://opengraph.githubassets.com/1/${r.full_name}`)}
        <span class="lang">${r.language || "Repo"}</span><h3>${this.splitTitle(pretty)}</h3>
        <p>${r.description || "No description yet, but the code speaks for itself."}</p>
        <div class="meta"><span>★ ${r.stargazers_count || 0}</span><span class="go">View on GitHub →</span></div>`;
      this.els.repoGrid.appendChild(a);
    });
  },

  /* ---------- skills ---------- */
  renderSkills(groups) {
    groups.forEach(g => {
      const d = document.createElement("div");
      d.className = "skill-group reveal";
      d.innerHTML = `<h3>${g.group}</h3>` + g.items.map(([n, v]) =>
        `<div class="skill-row"><span>${n}</span><div class="skill-bar"><div class="fill" data-v="${v}"></div></div><span class="lv">0</span></div>`).join("");
      this.els.skillsBody.appendChild(d);
    });
  },

  animateSkillBars() {
    this.els.skillsBody.querySelectorAll(".skill-row").forEach((r, i) => {
      const f = r.querySelector(".fill"), lv = r.querySelector(".lv"), v = +f.dataset.v;
      if (this.reduced) { f.style.width = v + "%"; lv.textContent = v; return; }
      f.style.transition = "none"; f.style.width = "0"; lv.textContent = "0"; void f.offsetWidth; f.style.transition = "";
      setTimeout(() => { f.style.width = v + "%"; this.count(lv, v, 1000); }, 700 + i * 70);
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
    tick(); setInterval(tick, 1000);
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
      document.querySelectorAll(".menu-art.on").forEach(a => (a.style.transform = `translate3d(${cx * 14}px,${cy * 9}px,0) scale(1.05)`));
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
      cur.classList.toggle("link", !!e.target.closest?.("a,button,.card,.menu-item,#big-name,input,textarea"));
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
    [this.els.featGrid, this.els.repoGrid].forEach(g => {
      g.addEventListener("pointermove", e => {
        const c = e.target.closest(".card"); if (!c) return;
        const r = c.getBoundingClientRect();
        c.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 9 + "deg");
        c.style.setProperty("--rx", -((e.clientY - r.top) / r.height - 0.5) * 9 + "deg");
      });
      g.addEventListener("pointerout", e => {
        const c = e.target.closest(".card");
        if (c && !c.contains(e.relatedTarget)) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); }
      });
    });
  },
};
