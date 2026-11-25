/* CONTROLLER: input, navigation and routing. Talks to Model and View. */
const Controller = {
  transitioning: true,   // locked until the intro curtain lifts
  audioUnlocked: false,
  sound: true,
  lastFocus: null,
  pal: { items: [], sel: 0, from: null },
  narrow: matchMedia("(max-width: 899px)"),

  init() {
    View.init();
    this.sound = Model.pref("sound", true); View.setSound(this.sound);
    Model.state.theme = Model.pref("theme", "p5");
    Music.init();
    View.setTheme(Model.state.theme);
    Model.state.motion = Model.pref("motion", true); View.setMotion(Model.state.motion);
    this.bindMenu(); this.bindKeyboard(); this.bindAudio(); this.bindContactForm(); this.bindProjects();
    this.bindOverlays(); this.bindScroll(); this.bindPalette(); this.bindSkills();
    addEventListener("popstate", () => this.go(this.fromHash(), false));   // back/forward buttons
    const s = this.fromHash();
    s === "home" ? View.showScreen("home") : this.enter(s);                // deep links like /#about
    this.select(0, true);
    let seen = false; try { seen = sessionStorage.getItem("pf:booted") === "1"; sessionStorage.setItem("pf:booted", "1"); } catch {}
    View.boot(!seen, () => { this.transitioning = false; this.prebuild(); });
  },

  /* ---------- navigation ---------- */
  fromHash() { const s = location.hash.slice(1); return Model.screens.includes(s) ? s : "home"; },

  go(screen, push = true, after) {
    if (this.transitioning) return;
    if (screen === Model.state.screen) { after && after(); return; }
    this.closeModal(true); this.closeHelp(true); this.closePalette(true);
    this.transitioning = true; this.play();
    if (push) history.pushState({}, "", screen === "home" ? location.pathname + location.search : "#" + screen);
    const from = Model.sections.indexOf(Model.state.screen), to = Model.sections.indexOf(screen);
    const dir = from >= 0 && to < from ? -1 : 1;   // going "left" through the tabs sweeps the other way
    const label = screen === "home" ? "MENU" : screen.toUpperCase();
    const kicker = screen === "home" ? "Back to" : String(to + 1).padStart(2, "0") + " / 04";
    View.wipe(label, kicker, dir, () => this.enter(screen), () => {
      this.transitioning = false;
      if (this.fromHash() !== Model.state.screen) this.go(this.fromHash(), false);   // catch a back-press mid-wipe
      else after && after();
    });
  },

  // Building a screen's markup is the heavy part of switching to it, so it happens once, ahead of time while the browser is
  // idle (see prebuild), and the switch itself only has to flip the screen on.
  build(screen) {
    if (screen === "about" && !Model.state.aboutBuilt) { View.renderAbout(Model.about, Model.traits); Model.state.aboutBuilt = true; }
    if (screen === "skills" && !Model.state.skillsBuilt) {
      View.skProjects = Object.fromEntries(Model.projects.map((p, i) => [p.id, { p, i }]));
      View.renderSkillTabs(Model.skills); Model.state.skillsBuilt = true;
    }
    if (screen === "projects" && !Model.state.projectsBuilt) {
      const counts = Model.projects.reduce((o, p) => (o[p.cat] = (o[p.cat] || 0) + 1, o), { all: Model.projects.length });
      View.renderFilters(Model.categories, counts, Model.state.filter);
      View.renderProjectList(Model.projects);
      View.applyFilter(Model.state.filter);
      Model.state.projectsBuilt = true;
    }
  },
  prebuild() {
    const idle = window.requestIdleCallback ? f => requestIdleCallback(f, { timeout: 1500 }) : f => setTimeout(f, 200);
    ["about", "skills", "projects"].forEach(name => idle(() => this.build(name)));
    // warm the project screenshots so the first visit doesn't decode them mid-transition
    idle(() => Model.projects.forEach(p => (p.shots || []).slice(0, 1).forEach(sh => { const im = new Image(); im.decoding = "async"; im.src = sh.src; im.decode && im.decode().catch(() => {}); })));
  },

  enter(screen) {
    Model.state.screen = screen;
    this.build(screen);
    View.showScreen(screen);
    if (screen === "projects") this.loadProjects();
    if (screen === "skills") View.showSkillGroup(Model.skills, Model.state.skillGroup, Model.state.skill, { fromZero: true });
    if (screen === "home") View.els.menuItems[Model.state.menuIndex].focus({ preventScroll: true });
    else document.getElementById("stage").focus({ preventScroll: true });
  },

  step(d) {   // Q / E through the sections
    const S = Model.sections, i = S.indexOf(Model.state.screen);
    this.go(S[(i + d + S.length) % S.length]);
  },

  select(index, silent) {
    const n = View.els.menuItems.length, next = (index + n) % n;
    if (next !== Model.state.menuIndex && !silent) this.play();
    Model.state.menuIndex = next;
    View.setMenuSelection(next, Model.captions[View.els.menuItems[next].dataset.target]);
  },

  /* ---------- projects ---------- */
  loadProjects() {
    this.build("projects");
    View.showProjectDetail(Model.projects[Model.state.project], Model.state.project, Model.categories, true);
    if (!Model.state.reposLoaded) this.loadRepos();
  },

  async loadRepos() {
    View.repoLoading();
    const { repos, live } = await Model.fetchRepos();
    if (!live) { View.repoError(); return; }      // retried on the next visit or with the button
    View.renderRepos(repos, Model);
    Model.state.reposLoaded = true;
  },

  bindProjects() {
    View.els.filters.addEventListener("click", e => {
      const b = e.target.closest("[data-filter]"); if (!b || b.dataset.filter === Model.state.filter) return;
      Model.state.filter = b.dataset.filter; this.play();
      View.setFilter(Model.state.filter);
      const shown = View.applyFilter(Model.state.filter, true);
      if (shown.length && !shown.includes(Model.state.project)) this.selectProject(shown[0], false);
    });
    // screenshot thumbnails, in the side panel and in the full-screen details
    [document.getElementById("pj-detail"), View.els.modalBody].forEach((el, i) => el.addEventListener("click", e => {
      const t = e.target.closest("[data-shot]"); if (!t) return;
      this.play(); View.showShot(t, Model.projects[i === 0 ? Model.state.project : Model.state.modal]);
    }));
    const list = document.getElementById("pj-list");
    list.addEventListener("click", e => {
      const b = e.target.closest(".pj-item"); if (!b) return;
      const idx = +b.dataset.idx;
      // phones have no room for the side panel, so the same details open full-screen
      if (this.narrow.matches) this.openModal(idx, b); else this.selectProject(idx);
    });
    list.addEventListener("pointerover", e => {
      const b = e.target.closest(".pj-item"); if (b && e.pointerType === "mouse" && !this.narrow.matches) this.selectProject(+b.dataset.idx);
    });
    list.addEventListener("keydown", e => {
      if (!e.target.closest(".pj-item") || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      e.preventDefault();
      const items = [...list.querySelectorAll("li:not([hidden]) .pj-item")], i = items.indexOf(e.target);
      const next = items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
      next.focus(); if (!this.narrow.matches) this.selectProject(+next.dataset.idx);
    });
    View.els.repoStatus.addEventListener("click", e => { if (e.target.closest("[data-retry]")) { this.play(); this.loadRepos(); } });
  },

  selectProject(idx, sound = true) {
    if (idx === Model.state.project) return;
    Model.state.project = idx; if (sound) this.play();
    View.showProjectDetail(Model.projects[idx], idx, Model.categories, true);
  },

  openModal(idx, from) {
    const total = Model.projects.length;
    const wasOpen = Model.state.modal >= 0;
    Model.state.modal = idx; this.play();
    View.renderModal(Model.projects[idx], idx, idx, total, Model.categories, wasOpen);
    if (!wasOpen) { this.lastFocus = from || document.activeElement; View.openOverlay(View.els.modal, View.els.modalPanel); }
  },
  stepModal(d) {
    const n = Model.projects.length;
    this.openModal((Model.state.modal + d + n) % n);
  },
  closeModal(quiet) {
    if (Model.state.modal < 0) return;
    Model.state.modal = -1; View.closeOverlay(View.els.modal);
    if (!quiet) { this.play(); this.lastFocus?.focus?.({ preventScroll: true }); }
  },

  // From a skill's "Used in" link or the palette: go to Projects, make sure the card is visible, open its details.
  showProject(idx) {
    const p = Model.projects[idx];
    this.go("projects", true, () => {
      if (Model.state.filter !== "all" && Model.state.filter !== p.cat) {
        Model.state.filter = "all"; View.setFilter("all"); View.applyFilter("all");
      }
      const b = document.querySelector(`.pj-item[data-idx="${idx}"]`);
      if (this.narrow.matches) this.openModal(idx, b);
      else { this.selectProject(idx); b.focus({ preventScroll: true }); View.els.screens.projects.scrollTop = 0; }
    });
  },

  selectGroup(gi, focus) {
    const n = Model.skills.length; gi = (gi + n) % n;
    if (gi === Model.state.skillGroup) return;
    Model.state.skillGroup = gi; Model.state.skill = 0; this.play();
    View.showSkillGroup(Model.skills, gi, 0);
    if (focus) document.getElementById("sk-tab-" + gi).focus();
  },
  selectSkill(si, sound = true) {
    if (si === Model.state.skill) return;
    Model.state.skill = si; if (sound) this.play();
    View.showSkill(Model.skills[Model.state.skillGroup], si);
  },

  bindSkills() {
    const body = View.els.skillsBody;
    const wide = matchMedia("(min-width: 901px)");
    body.addEventListener("click", e => {
      const proj = e.target.closest("[data-project]"); if (proj) { this.showProject(+proj.dataset.project); return; }
      const tab = e.target.closest("[data-group]"); if (tab) { this.selectGroup(+tab.dataset.group); return; }
      const sk = e.target.closest("[data-si]");
      if (!sk) return;
      this.selectSkill(+sk.dataset.si);
      // stacked layout: the detail sits above the list, so bring it into view
      if (!wide.matches) document.getElementById("sk-detail").scrollIntoView({ block: "nearest", behavior: View.reduced ? "auto" : "smooth" });
    });
    // Hovering previews a skill like moving a cursor through a game menu. Only in the wide layout: stacked, the detail sits above
    // the list, so a change in its height would shift the row out from under the pointer and flip the selection back and forth.
    body.addEventListener("pointerover", e => {
      if (e.pointerType !== "mouse") return;
      const sk = e.target.closest(".sk-item, #sk-radar [data-si]");
      if (sk && (wide.matches || !sk.matches(".sk-item"))) this.selectSkill(+sk.dataset.si);
    });
    body.addEventListener("keydown", e => {
      if (e.target.closest(".sk-groups") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault(); e.stopPropagation(); this.selectGroup(Model.state.skillGroup + (e.key === "ArrowRight" ? 1 : -1), true);
      } else if (e.target.closest(".sk-item") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const items = [...body.querySelectorAll(".sk-item")], i = (Model.state.skill + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        this.selectSkill(i); items[i].focus();
      }
    });
  },

  /* ---------- help ---------- */
  openHelp() { if (!View.els.help.hidden) return; this.helpFocus = document.activeElement; View.openOverlay(View.els.help); },
  closeHelp(quiet) {
    if (View.els.help.hidden || !View.els.help.classList.contains("open")) return;
    View.closeOverlay(View.els.help); if (!quiet) this.helpFocus?.focus?.({ preventScroll: true });
  },

  /* ---------- quick jump palette ---------- */
  paletteSource() {
    const go = s => () => this.go(s);
    return [
      ...Model.sections.map((s, i) => ({ label: s[0].toUpperCase() + s.slice(1), kind: "Section " + (i + 1), run: go(s) })),
      { label: "Main menu", kind: "Section", run: go("home") },
      ...Model.projects.map((p, i) => ({ label: View.nice(p.title), kind: p.cat === "small" ? "Smaller build" : "Project", color: p.color, keys: (p.stack || []).join(" ") + " " + p.tag, run: () => this.showProject(i) })),
      ...Model.projects.flatMap(p => (p.links || []).filter(l => /live|download/i.test(l.label)).map(l => ({ label: `${l.label}: ${View.nice(p.title)}`, kind: "Opens new tab", color: p.color, run: () => open(l.url, "_blank", "noopener") }))),
      { label: "Download CV (PDF)", kind: "File", keys: "resume", run: () => { const a = document.createElement("a"); a.href = "assets/resume/Resume.pdf"; a.download = "Resume.pdf"; a.click(); } },
      { label: "GitHub profile", kind: "Opens new tab", run: () => open("https://github.com/" + Model.githubUser, "_blank", "noopener") },
      { label: "Send me a message", kind: "Contact", keys: "email form", run: () => this.go("contact", true, () => document.querySelector("#contact-form [name=name]").focus()) },
      { label: () => (Music.playing ? "Pause music" : "Play music"), kind: "Music", keys: "beneath the mask song audio", run: () => Music.toggle() },
      { label: "Next song", kind: "Music", keys: "skip track playlist", run: () => Music.go(1) },
      { label: "Previous song", kind: "Music", keys: "back track playlist", run: () => Music.go(-1) },
      ...Model.music.map((t, i) => ({ label: "Play " + t.title, kind: "Music", keys: "song track", run: () => Music.select(i) })),
      { label: "Open music player", kind: "Music", keys: "volume seek", run: () => Music.toggleOpen(true) },
      { label: () => (this.sound ? "Turn sound effects off" : "Turn sound effects on"), kind: "Setting", keys: "audio mute clicks", run: () => this.toggleSound() },
      { label: () => (Model.state.motion ? "Pause background animation" : "Play background animation"), kind: "Setting", keys: "motion", run: () => this.toggleMotion() },
      ...Model.themes.map(t => ({ label: "Look: " + t.name, kind: "Theme", keys: "theme style skin persona", run: () => this.cycleTheme(t.id) })),
      { label: "Keyboard controls", kind: "Help", keys: "shortcuts", run: () => this.openHelp() },
    ];
  },
  filterPalette() {
    const q = View.els.paletteInput.value.trim().toLowerCase();
    this.pal.items = this.paletteSource().map(it => ({ ...it, label: typeof it.label === "function" ? it.label() : it.label }))
      .filter(it => !q || (it.label + " " + it.kind + " " + (it.keys || "")).toLowerCase().includes(q));
    this.pal.sel = 0; View.renderPalette(this.pal.items, 0);
  },
  openPalette() {
    if (!View.els.palette.hidden) return;
    this.closeModal(true); this.closeHelp(true);
    this.pal.from = document.activeElement; View.els.paletteInput.value = ""; this.filterPalette();
    View.openOverlay(View.els.palette, View.els.paletteInput); this.play();
  },
  closePalette(quiet) {
    if (View.els.palette.hidden || !View.els.palette.classList.contains("open")) return;
    View.closeOverlay(View.els.palette); if (!quiet) this.pal.from?.focus?.({ preventScroll: true });
  },
  runPalette(i) {
    const it = this.pal.items[i]; if (!it) return;
    this.closePalette(true); it.run();
  },
  bindPalette() {
    const inp = View.els.paletteInput;
    document.getElementById("palette-btn").addEventListener("click", () => this.openPalette());
    inp.addEventListener("input", () => this.filterPalette());
    inp.addEventListener("keydown", e => {
      const n = this.pal.items.length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); if (!n) return;
        this.pal.sel = (this.pal.sel + (e.key === "ArrowDown" ? 1 : -1) + n) % n; View.renderPalette(this.pal.items, this.pal.sel);
      } else if (e.key === "Enter") { e.preventDefault(); this.runPalette(this.pal.sel); }
      else if (e.key === "Escape") { e.preventDefault(); this.closePalette(); }
    });
    View.els.paletteList.addEventListener("click", e => { const li = e.target.closest("[data-i]"); if (li) this.runPalette(+li.dataset.i); });
    View.els.palette.addEventListener("click", e => { if (e.target.closest(".overlay-bg")) this.closePalette(); });
  },

  bindOverlays() {
    View.els.modal.addEventListener("click", e => {
      if (e.target.closest("[data-close]")) this.closeModal();
      const s = e.target.closest("[data-step]"); if (s) this.stepModal(+s.dataset.step);
    });
    View.els.help.addEventListener("click", e => { if (e.target.closest("[data-close]")) this.closeHelp(); });
    document.getElementById("help-btn").addEventListener("click", () => this.openHelp());
    View.els.soundBtn.addEventListener("click", () => this.toggleSound());
    View.els.motionBtn.addEventListener("click", () => this.toggleMotion());
    document.getElementById("theme-btn").addEventListener("click", () => this.cycleTheme());
    // keep Tab inside an open dialog
    [View.els.modal, View.els.help, View.els.palette].forEach(o => o.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;
      const f = [...o.querySelectorAll("a[href],button,input")].filter(x => x.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !o.contains(document.activeElement))) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }));
  },

  /* ---------- scroll: progress bar + back to top ---------- */
  bindScroll() {
    Object.values(View.els.screens).forEach(s => s.addEventListener("scroll", () => {
      if (s.classList.contains("active")) View.updateScroll(s);
    }, { passive: true }));
    View.els.toTop.addEventListener("click", () => { View.els.screens[Model.state.screen].scrollTop = 0; this.play(); document.getElementById("stage").focus({ preventScroll: true }); });
  },

  /* ---------- sound + motion settings (remembered per browser) ---------- */
  play() { if (this.audioUnlocked && this.sound) View.playSelect(); },
  toggleSound() {
    this.sound = !this.sound; Model.setPref("sound", this.sound); View.setSound(this.sound);
    View.toast(this.sound ? "Sound effects on" : "Sound effects off"); this.play();
  },
  cycleTheme(to) {
    if (this.transitioning) return;
    const cur = Model.themes.findIndex(t => t.id === Model.state.theme);
    const next = to || Model.themes[(cur + 1) % Model.themes.length].id;
    if (next === Model.state.theme) return;
    const name = Model.themes.find(t => t.id === next).name;
    this.transitioning = true;
    View.wipe(name.toUpperCase(), "Theme", 1, () => { Model.state.theme = next; Model.setPref("theme", next); View.setTheme(next); }, () => { this.transitioning = false; View.toast("Look: " + name); this.play(); });
  },
  toggleMotion() {
    Model.state.motion = !Model.state.motion; Model.setPref("motion", Model.state.motion); View.setMotion(Model.state.motion);
    View.toast(Model.state.motion ? "Background animation on" : "Background animation paused"); this.play();
  },

  bindAudio() {   // browsers block sound until the first gesture
    const unlock = () => { this.audioUnlocked = true; };
    addEventListener("pointerdown", unlock, { once: true, capture: true });
    addEventListener("keydown", unlock, { once: true, capture: true });
  },

  /* ---------- input ---------- */
  bindMenu() {
    View.els.menuItems.forEach((item, i) => {
      item.addEventListener("mouseenter", () => this.select(i));
      item.addEventListener("focus", () => this.select(i));
      item.addEventListener("click", () => this.go(item.dataset.target));
    });
    document.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => this.go(b.dataset.nav)));
  },

  bindKeyboard() {
    addEventListener("keydown", e => {
      const k = e.key, home = Model.state.screen === "home";
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "k") { e.preventDefault(); View.els.palette.hidden ? this.openPalette() : this.closePalette(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest("input,textarea")) return;

      if (!View.els.palette.hidden) return;
      if (!View.els.help.hidden) { if (k === "Escape" || k === "?") { this.closeHelp(); e.preventDefault(); } return; }
      if (Model.state.modal >= 0) {
        if (k === "Escape") this.closeModal();
        else if (k === "ArrowRight") this.stepModal(1);
        else if (k === "ArrowLeft") this.stepModal(-1);
        return;
      }
      if (k === "/") { e.preventDefault(); this.openPalette(); return; }
      if (k === "?") { this.openHelp(); return; }
      if (k === "m" || k === "M") { this.toggleSound(); return; }
      if (k === "p" || k === "P") { Music.toggle(); return; }
      if (k === "]") { Music.go(1); return; }
      if (k === "[") { Music.go(-1); return; }
      if (k === "Escape" && Music.open) { Music.toggleOpen(false); return; }
      if (k === "t" || k === "T") { this.cycleTheme(); return; }
      if (k === "b" || k === "B") { this.toggleMotion(); return; }
      if (k >= "1" && k <= "4") { this.go(Model.sections[+k - 1]); return; }

      if (home) {
        const i = Model.state.menuIndex;
        if (k === "ArrowDown") { this.select(i + 1); View.els.menuItems[Model.state.menuIndex].focus(); e.preventDefault(); }
        else if (k === "ArrowUp") { this.select(i - 1); View.els.menuItems[Model.state.menuIndex].focus(); e.preventDefault(); }
        else if (k === "Enter" && !e.target.closest("button,a")) this.go(View.els.menuItems[i].dataset.target);
      } else {
        if (k === "Escape") { this.go("home"); e.preventDefault(); }
        else if (k === "q" || k === "Q" || (k === "ArrowLeft" && !e.target.closest(".filters,.sk-groups"))) this.step(-1);
        else if (k === "e" || k === "E" || (k === "ArrowRight" && !e.target.closest(".filters,.sk-groups"))) this.step(1);
      }
    });
  },

  /* ---------- contact form (formsubmit.co relay, mailto fallback) ---------- */
  bindContactForm() {
    const form = document.getElementById("contact-form"), status = document.getElementById("form-status"), btn = form.querySelector(".form-send");
    const counter = document.getElementById("msg-count"), fields = ["name", "email", "message"];
    const count = () => (counter.textContent = `${form.message.value.length} / 3000`);
    const setErr = (f, msg) => { const fl = form[f].closest(".field"); fl.querySelector(".err").textContent = msg; form[f].setAttribute("aria-invalid", !!msg); if (msg) { fl.classList.remove("bad"); void fl.offsetWidth; fl.classList.add("bad"); } else fl.classList.remove("bad"); };
    // restore an unsent draft
    const draft = Model.pref("draft", null);
    if (draft) fields.forEach(f => { if (draft[f]) form[f].value = draft[f]; });
    count();
    let saveT = 0;
    form.addEventListener("input", e => {
      if (fields.includes(e.target.name)) setErr(e.target.name, "");
      if (e.target === form.message) count();
      clearTimeout(saveT); saveT = setTimeout(() => Model.setPref("draft", Object.fromEntries(fields.map(f => [f, form[f].value]))), 400);
    });
    form.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); } });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (d._honey) return;
      const errs = {
        name: d.name.trim() ? "" : "Add your name so I know who's writing.",
        email: !d.email.trim() ? "Add an email so I can reply." : form.email.checkValidity() ? "" : "That email address doesn't look complete (example: name@domain.com).",
        message: d.message.trim() ? "" : "Write a message before sending.",
      };
      fields.forEach(f => setErr(f, errs[f]));
      const bad = fields.filter(f => errs[f]);
      if (bad.length) { form[bad[0]].focus(); status.textContent = "Fix the highlighted field" + (bad.length > 1 ? "s" : "") + " and send again."; return; }
      btn.disabled = true; btn.querySelector("span").textContent = "Sending…"; status.textContent = "Sending your message…";
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${Model.contactEmail}`, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: d.name, email: d.email, message: d.message, _subject: `Portfolio message from ${d.name}` }),
        });
        if (!res.ok) throw new Error(res.status);
        status.textContent = "Sent. I'll reply to " + d.email + " soon."; View.toast("Message sent");
        form.classList.add("sent"); setTimeout(() => form.classList.remove("sent"), 3800);
        clearTimeout(saveT); form.reset(); count(); Model.setPref("draft", null); this.play();
      } catch {
        status.textContent = "The form relay didn't respond, so I'm opening your email app with the message filled in.";
        location.href = `mailto:${Model.contactEmail}?subject=${encodeURIComponent("Portfolio message from " + d.name)}&body=${encodeURIComponent(d.message + "\n\nReply to: " + d.email)}`;
      } finally { btn.disabled = false; btn.querySelector("span").textContent = "Send message"; }
    });
  },
};

Controller.init();
