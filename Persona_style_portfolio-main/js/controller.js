/* CONTROLLER — input, navigation and routing. Talks to Model and View. */
const Controller = {
  transitioning: false,
  audioUnlocked: false,

  init() {
    View.init();
    this.bindMenu(); this.bindKeyboard(); this.bindAudio(); this.bindContactForm();
    addEventListener("popstate", () => this.go(this.fromHash(), false));   // back/forward buttons
    const s = this.fromHash();
    s === "home" ? View.showScreen("home") : this.enter(s);                // deep links like /#about
  },

  /* ---------- navigation ---------- */
  fromHash() { const s = location.hash.slice(1); return Model.screens.includes(s) ? s : "home"; },

  go(screen, push = true) {
    if (this.transitioning || screen === Model.state.screen) return;
    this.transitioning = true; this.play();
    if (push) history.pushState({}, "", screen === "home" ? location.pathname + location.search : "#" + screen);
    View.wipe(() => this.enter(screen), () => {
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
  },

  select(index) {
    const n = View.els.menuItems.length, next = (index + n) % n;
    if (next !== Model.state.menuIndex) this.play();
    Model.state.menuIndex = next; View.setMenuSelection(next);
  },

  async loadProjects() {
    View.renderFeatured(Model.featured);
    if (Model.state.reposLoaded) return;
    View.skeletons();
    const { repos, live } = await Model.fetchRepos();
    const status = !live ? "Couldn't reach GitHub right now. Featured projects are shown above."
      : !repos.length ? "No other public repositories yet"
      : `${repos.length} repositories · live from GitHub`;
    View.renderRepos(repos, status, Model);
    Model.state.reposLoaded = live;   // retry next visit if GitHub was unreachable
  },

  /* ---------- sound ---------- */
  play() { if (this.audioUnlocked) View.playSelect(); },

  syncAudioButton() {
    const b = document.getElementById("audio-toggle"), v = View.els.video;
    b.textContent = v.muted ? "🔇" : "🔊";
    b.setAttribute("aria-label", v.muted ? "Turn audio on" : "Mute audio");
  },

  bindAudio() {
    const v = View.els.video, b = document.getElementById("audio-toggle");
    const unlock = () => {
      this.audioUnlocked = true;
      v.muted = false; v.volume = 0.5;
      if (Model.state.screen === "home") v.play().catch(() => {});
      this.syncAudioButton();
    };
    addEventListener("pointerdown", unlock, { once: true, capture: true });
    addEventListener("keydown", unlock, { once: true, capture: true });
    b.addEventListener("click", e => {
      e.stopPropagation(); v.muted = !v.muted;
      if (!v.muted && Model.state.screen === "home") v.play().catch(() => {});
      this.syncAudioButton();
    });
  },

  /* ---------- input ---------- */
  bindMenu() {
    View.els.menuItems.forEach((item, i) => {
      item.addEventListener("mouseenter", () => this.select(i));
      item.addEventListener("focus", () => this.select(i));
      item.addEventListener("click", () => this.go(item.dataset.target));
    });
    document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => this.go("home")));
    document.getElementById("big-name").addEventListener("click", () => Model.state.screen !== "home" ? this.go("home") : this.play());
  },

  bindKeyboard() {
    addEventListener("keydown", e => {
      if (e.target.closest("input,textarea")) return;
      if (Model.state.screen === "home") {
        const i = Model.state.menuIndex;
        if (e.key === "ArrowDown") { this.select(i + 1); e.preventDefault(); }
        else if (e.key === "ArrowUp") { this.select(i - 1); e.preventDefault(); }
        else if (e.key === "Enter" && !e.target.closest("button")) this.go(View.els.menuItems[i].dataset.target);
      } else if (e.key === "Escape") this.go("home");
    });
  },

  /* ---------- contact form (formsubmit.co relay, mailto fallback) ---------- */
  bindContactForm() {
    const form = document.getElementById("contact-form"), status = document.getElementById("form-status"), btn = form.querySelector(".form-send");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (d._honey) return;
      if (!d.name.trim() || !d.email.trim() || !d.message.trim()) { status.textContent = "Fill in your name, email and message first."; return; }
      if (!form.email.checkValidity()) { status.textContent = "That email address doesn't look right."; return; }
      btn.disabled = true; status.textContent = "Sending…";
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${Model.contactEmail}`, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: d.name, email: d.email, message: d.message, _subject: `Portfolio message from ${d.name}` }),
        });
        if (!res.ok) throw new Error(res.status);
        status.textContent = "Sent! I'll get back to you soon."; form.reset(); this.play();
      } catch {
        status.textContent = "Couldn't reach the relay. Opening your email app instead…";
        location.href = `mailto:${Model.contactEmail}?subject=${encodeURIComponent("Portfolio message from " + d.name)}&body=${encodeURIComponent(d.message + "\n\nReply to: " + d.email)}`;
      } finally { btn.disabled = false; }
    });
  },
};

Controller.init();
