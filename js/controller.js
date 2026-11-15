/* CONTROLLER — input, navigation and routing. Talks to Model and View. */
const Controller = {
  transitioning: true,   // locked until the intro curtain lifts
  audioUnlocked: false,
  sound: true,
  lastFocus: null,

  init() {
    View.init();
    this.sound = Model.pref("sound", true); View.setSound(this.sound);
    this.bindMenu(); this.bindKeyboard(); this.bindAudio(); this.bindContactForm(); this.bindProjects(); this.bindOverlays(); this.bindScroll();
    addEventListener("popstate", () => this.go(this.fromHash(), false));   // back/forward buttons
    const s = this.fromHash();
    s === "home" ? View.showScreen("home") : this.enter(s);                // deep links like /#about
    this.select(0, true);
    View.boot(() => { this.transitioning = false; });
  },

  /* ---------- navigation ---------- */
  fromHash() { const s = location.hash.slice(1); return Model.screens.includes(s) ? s : "home"; },

  go(screen, push = true) {
    if (this.transitioning || screen === Model.state.screen) return;
    this.closeModal(true); this.closeHelp(true);
    this.transitioning = true; this.play();
    if (push) history.pushState({}, "", screen === "home" ? location.pathname + location.search : "#" + screen);
    const from = Model.sections.indexOf(Model.state.screen), to = Model.sections.indexOf(screen);
    const dir = from >= 0 && (to < from) ? -1 : 1;   // going "left" through the tabs sweeps the other way
    const label = screen === "home" ? "MENU" : screen.toUpperCase();
    const kicker = screen === "home" ? "Back to" : String(to + 1).padStart(2, "0") + " / 04";
    View.wipe(label, kicker, dir, () => this.enter(screen), () => {
      this.transitioning = false;
      if (this.fromHash() !== Model.state.screen) this.go(this.fromHash(), false);   // catch a back-press mid-wipe
    });
  },

  enter(screen) {
    Model.state.screen = screen;
    if (screen === "about" && !Model.state.aboutBuilt) { View.renderAbout(Model.about); Model.state.aboutBuilt = true; }
    if (screen === "skills" && !Model.state.skillsBuilt) { View.renderSkills(Model.skills); Model.state.skillsBuilt = true; }
    View.showScreen(screen);
    if (screen === "projects") this.loadProjects();
    if (screen === "skills") View.animateSkillBars();
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
  async loadProjects() {
    if (!Model.state.projectsBuilt) {
      const counts = Model.projects.reduce((o, p) => (o[p.cat] = (o[p.cat] || 0) + 1, o), { all: Model.projects.length });
      View.renderFilters(Model.categories, counts, Model.state.filter);
      View.renderProjects(Model.projects, Model.categories);
      View.applyFilter(Model.state.filter);
      Model.state.projectsBuilt = true;
    }
    if (Model.state.reposLoaded) return;
    View.skeletons();
    const { repos, live } = await Model.fetchRepos();
    const status = !live ? "Couldn't reach GitHub right now. Everything above is still here."
      : !repos.length ? "Every public repo is already featured above."
      : `${repos.length} more ${repos.length === 1 ? "repository" : "repositories"} · live from GitHub`;
    View.renderRepos(repos, status, Model);
    Model.state.reposLoaded = live;   // retry next visit if GitHub was unreachable
  },

  bindProjects() {
    View.els.filters.addEventListener("click", e => {
      const b = e.target.closest("[data-filter]"); if (!b || b.dataset.filter === Model.state.filter) return;
      Model.state.filter = b.dataset.filter; this.play();
      View.setFilter(Model.state.filter); View.applyFilter(Model.state.filter);
    });
    const grids = [View.els.featGrid, View.els.smallGrid];
    grids.forEach(g => g.addEventListener("click", e => {
      if (e.target.closest("a")) return;                                   // real links just work
      const c = e.target.closest(".card.clickable"); if (!c) return;
      this.openModal(+c.dataset.idx, e.target.closest("button") || c.querySelector("[data-open]"));
    }));
  },

  detailList() { return Model.projects.map((p, i) => i).filter(i => Model.projects[i].highlights); },

  openModal(idx, from) {
    const list = this.detailList(), pos = list.indexOf(idx); if (pos < 0) return;
    const wasOpen = Model.state.modal >= 0;
    Model.state.modal = idx; this.play();
    View.renderModal(Model.projects[idx], pos, list.length, Model.categories, wasOpen);
    if (!wasOpen) { this.lastFocus = from || document.activeElement; View.openOverlay(View.els.modal, View.els.modalPanel); }
  },
  stepModal(d) {
    const list = this.detailList(), pos = list.indexOf(Model.state.modal);
    this.openModal(list[(pos + d + list.length) % list.length]);
  },
  closeModal(quiet) {
    if (Model.state.modal < 0) return;
    Model.state.modal = -1; View.closeOverlay(View.els.modal);
    if (!quiet) { this.play(); this.lastFocus?.focus?.({ preventScroll: true }); }
  },

  openHelp() { if (!View.els.help.hidden) return; this.helpFocus = document.activeElement; View.openOverlay(View.els.help); },
  closeHelp(quiet) {
    if (View.els.help.hidden || !View.els.help.classList.contains("open")) return;
    View.closeOverlay(View.els.help); if (!quiet) this.helpFocus?.focus?.({ preventScroll: true });
  },

  bindOverlays() {
    View.els.modal.addEventListener("click", e => {
      if (e.target.closest("[data-close]")) this.closeModal();
      const s = e.target.closest("[data-step]"); if (s) this.stepModal(+s.dataset.step);
    });
    View.els.help.addEventListener("click", e => { if (e.target.closest("[data-close]")) this.closeHelp(); });
    document.getElementById("help-btn").addEventListener("click", () => this.openHelp());
    View.els.soundBtn.addEventListener("click", () => this.toggleSound());
    // keep Tab inside an open dialog
    [View.els.modal, View.els.help].forEach(o => o.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;
      const f = [...o.querySelectorAll("a[href],button")].filter(x => x.offsetParent);
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
    View.els.toTop.addEventListener("click", () => { View.els.screens[Model.state.screen].scrollTop = 0; this.play(); });
  },

  /* ---------- sound ---------- */
  play() { if (this.audioUnlocked && this.sound) View.playSelect(); },
  toggleSound() {
    this.sound = !this.sound; Model.setPref("sound", this.sound); View.setSound(this.sound);
    View.toast(this.sound ? "Sound on" : "Sound off"); this.play();
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
    document.getElementById("big-name").addEventListener("click", () => this.play());
  },

  bindKeyboard() {
    addEventListener("keydown", e => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest("input,textarea")) return;
      const k = e.key, home = Model.state.screen === "home";

      if (!View.els.help.hidden) { if (k === "Escape" || k === "?") { this.closeHelp(); e.preventDefault(); } return; }
      if (Model.state.modal >= 0) {
        if (k === "Escape") this.closeModal();
        else if (k === "ArrowRight") this.stepModal(1);
        else if (k === "ArrowLeft") this.stepModal(-1);
        return;
      }
      if (k === "?") { this.openHelp(); return; }
      if (k === "m" || k === "M") { this.toggleSound(); return; }
      if (k >= "1" && k <= "4") { this.go(Model.sections[+k - 1]); return; }

      if (home) {
        const i = Model.state.menuIndex;
        if (k === "ArrowDown") { this.select(i + 1); View.els.menuItems[Model.state.menuIndex].focus(); e.preventDefault(); }
        else if (k === "ArrowUp") { this.select(i - 1); View.els.menuItems[Model.state.menuIndex].focus(); e.preventDefault(); }
        else if (k === "Enter" && !e.target.closest("button,a")) this.go(View.els.menuItems[i].dataset.target);
      } else {
        if (k === "Escape") { this.go("home"); e.preventDefault(); }
        else if (k === "q" || k === "Q" || (k === "ArrowLeft" && !e.target.closest(".filters"))) this.step(-1);
        else if (k === "e" || k === "E" || (k === "ArrowRight" && !e.target.closest(".filters"))) this.step(1);
      }
    });
  },

  /* ---------- contact form (formsubmit.co relay, mailto fallback) ---------- */
  bindContactForm() {
    const form = document.getElementById("contact-form"), status = document.getElementById("form-status"), btn = form.querySelector(".form-send");
    const counter = document.getElementById("msg-count"), fields = ["name", "email", "message"];
    const count = () => (counter.textContent = `${form.message.value.length} / 3000`);
    // restore an unsent draft
    const draft = Model.pref("draft", null);
    if (draft) fields.forEach(f => { if (draft[f]) form[f].value = draft[f]; });
    count();
    let saveT = 0;
    form.addEventListener("input", e => {
      e.target.closest(".field")?.classList.remove("bad");
      if (e.target === form.message) count();
      clearTimeout(saveT); saveT = setTimeout(() => Model.setPref("draft", Object.fromEntries(fields.map(f => [f, form[f].value]))), 400);
    });
    form.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); } });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (d._honey) return;
      const bad = fields.filter(f => !d[f].trim() || (f === "email" && !form.email.checkValidity()));
      if (bad.length) {
        bad.forEach(f => { const fl = form[f].closest(".field"); fl.classList.remove("bad"); void fl.offsetWidth; fl.classList.add("bad"); });
        form[bad[0]].focus();
        status.textContent = bad.includes("email") && d.email.trim() ? "That email address doesn't look right." : "Fill in your name, email and message first.";
        return;
      }
      btn.disabled = true; status.textContent = "Sending…";
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${Model.contactEmail}`, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: d.name, email: d.email, message: d.message, _subject: `Portfolio message from ${d.name}` }),
        });
        if (!res.ok) throw new Error(res.status);
        status.textContent = "Sent! I'll get back to you soon."; View.toast("Message sent ✓");
        form.reset(); count(); Model.setPref("draft", null); this.play();
      } catch {
        status.textContent = "Couldn't reach the relay. Opening your email app instead…";
        location.href = `mailto:${Model.contactEmail}?subject=${encodeURIComponent("Portfolio message from " + d.name)}&body=${encodeURIComponent(d.message + "\n\nReply to: " + d.email)}`;
      } finally { btn.disabled = false; }
    });
  },
};

Controller.init();
