/* MUSIC: the background playlist and its player. Starts on arrival unless the visitor turned it off last time; remembers
   the volume, the song and where they were in it. Songs come from Model.music. */
const Music = {
  index: 0,
  open: false,
  playing: false,
  wanted: true,
  mutedAuto: false,
  fadeTween: null,
  raf: 0,
  an: null,
  data: null,

  init() {
    const $ = id => document.getElementById(id);
    Object.assign(this, {
      audio: $("music"), panel: $("player"), btn: $("music-btn"), play: $("mp-play"), prev: $("mp-prev"), next: $("mp-next"),
      seek: $("mp-seek"), vol: $("mp-vol"), loop: $("mp-loop"), cur: $("mp-cur"), dur: $("mp-dur"), status: $("mp-status"),
      viz: $("mp-viz"), list: $("mp-list"), title: $("mp-title"), credit: $("mp-credit"),
    });
    this.tracks = Model.music;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.volume = Model.pref("musicVolume", 0.6);
    this.vol.value = Math.round(this.volume * 100);
    this.audio.volume = 0;
    this.audio.loop = Model.pref("musicRepeatOne", false);
    this.loop.setAttribute("aria-pressed", this.audio.loop);
    this.wanted = Model.pref("musicOn", true);
    const saved = Model.pref("musicTrack", 0);
    this.index = Number.isInteger(saved) && saved >= 0 && saved < this.tracks.length ? saved : 0;
    const mine = this.themeTrack();   // each look has its own song; the saved song only matters until the look changes
    if (mine >= 0) this.index = mine;

    this.renderList();
    this.load(this.index);

    this.btn.addEventListener("click", () => this.toggleOpen());
    this.play.addEventListener("click", () => this.toggle());
    this.prev.addEventListener("click", () => this.go(-1));
    this.next.addEventListener("click", () => this.go(1));
    this.list.addEventListener("click", e => { const b = e.target.closest("[data-track]"); if (b) this.select(+b.dataset.track); });
    this.loop.addEventListener("click", () => {
      this.audio.loop = !this.audio.loop;
      this.loop.setAttribute("aria-pressed", this.audio.loop); Model.setPref("musicRepeatOne", this.audio.loop);
    });
    this.vol.addEventListener("input", () => {
      this.volume = this.vol.value / 100; Model.setPref("musicVolume", this.volume);
      if (this.playing && !this.fadeTween) this.audio.volume = this.volume;
    });
    this.seek.addEventListener("input", () => {
      if (isFinite(this.audio.duration)) this.audio.currentTime = (this.seek.value / 1000) * this.audio.duration;
      this.paint();
    });
    this.panel.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); this.toggleOpen(false); this.btn.focus(); } });
    document.addEventListener("pointerdown", e => { if (this.open && !this.panel.contains(e.target) && !this.btn.contains(e.target)) this.toggleOpen(false); });

    const a = this.audio;
    a.addEventListener("timeupdate", () => this.paint());
    a.addEventListener("durationchange", () => this.paint());
    a.addEventListener("waiting", () => this.say("Loading…"));
    a.addEventListener("playing", () => { this.say(""); this.sync(); });
    a.addEventListener("pause", () => this.sync());
    // with repeat-one on, the element loops by itself and never fires "ended"
    a.addEventListener("ended", () => { if (this.playing) this.go(1); else { this.say("Finished. Press play to hear it again."); this.sync(); } });
    a.addEventListener("error", () => { this.playing = false; this.sync(); this.say("That song didn't load. Press play to try again."); });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => this.start());
      navigator.mediaSession.setActionHandler("pause", () => this.stop());
      navigator.mediaSession.setActionHandler("previoustrack", () => this.go(-1));
      navigator.mediaSession.setActionHandler("nexttrack", () => this.go(1));
    }

    this.sync(); this.paint();
    if (this.wanted) this.autostart();
  },

  say(msg) { this.status.textContent = msg; },
  fmt(s) { return isFinite(s) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "0:00"; },

  /* ---------- playlist ---------- */
  renderList() {
    this.list.innerHTML = this.tracks.map((t, i) =>
      `<li><button type="button" class="mp-track" data-track="${i}"><span class="mp-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="mp-t">${View.esc(t.title)}</span></button></li>`).join("");
  },

  // point the element at song i and update the labels; it doesn't start playing
  load(i) {
    this.index = i;
    const t = this.tracks[i];
    this.audio.src = t.src;
    this.title.textContent = t.title; this.credit.textContent = t.artist;
    this.list.querySelectorAll(".mp-track").forEach((b, j) => { j === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"); });
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist });
    this.paint();
  },

  select(i) {
    if (i === this.index && !this.audio.ended) { this.toggle(); return; }
    Model.setPref("musicTrack", i);
    try { sessionStorage.removeItem("pf:musicAt"); } catch {}
    this.load(i);
    this.start(true);
  },

  // the song that belongs to the current look (-1 if none)
  themeTrack() {
    const t = Model.themes.find(x => x.id === (Model.state.theme || "p5"));
    return t && t.song ? this.tracks.findIndex(x => x.src === t.song) : -1;
  },

  // Called when the look changes: switch to that look's song. If music was playing it carries on with the new song.
  forTheme() {
    if (!this.audio) return;
    const i = this.themeTrack();
    if (i < 0 || i === this.index) return;
    const was = this.playing, muted = this.mutedAuto;
    Model.setPref("musicTrack", i);
    try { sessionStorage.removeItem("pf:musicAt"); } catch {}
    this.load(i);
    if (!was) return;
    if (muted) { this.audio.muted = true; this.audio.volume = this.volume; this.audio.play().catch(() => {}); } else this.start(true);
  },

  go(delta) { this.select((this.index + delta + this.tracks.length) % this.tracks.length); },

  toggleOpen(force) {
    this.open = force === undefined ? !this.open : force;
    this.panel.hidden = !this.open;
    this.btn.setAttribute("aria-expanded", this.open);
    if (this.open) {
      if (this.playing && !this.mutedAuto) { this.ensureAnalyser(); if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); }
      this.play.focus({ preventScroll: true }); this.draw();
    }
  },

  toggle() { this.playing ? this.stop() : this.start(); },

  /* ---------- starting and stopping ---------- */

  // Browsers only allow sound after the visitor has interacted. So: try to play with sound; if that is blocked, play muted
  // straight away and unmute on the first click, tap or key press.
  async autostart() {
    const a = this.audio;
    this.restorePosition();
    try {
      a.volume = 0;
      await a.play();
      this.playing = true;
      this.fade(this.volume, this.reduced ? 0 : 1.5);
    } catch {
      try {
        a.muted = true; a.volume = this.volume;
        await a.play();
        this.playing = true; this.mutedAuto = true;
        this.say("Playing muted. Click anywhere or press a key to hear it.");
        document.body.classList.add("music-pending");
      } catch {
        this.playing = false;
        this.say("Click anywhere or press a key to start the music.");
        document.body.classList.add("music-pending");
      }
    }
    this.sync();
    if (!this.playing || this.mutedAuto) this.armUnlock();
  },

  armUnlock() {
    const unlock = () => {
      if (navigator.userActivation && !navigator.userActivation.isActive) return;   // the end of a scroll isn't a real interaction
      ["pointerdown", "keydown", "touchend"].forEach(t => removeEventListener(t, unlock, true));
      document.body.classList.remove("music-pending");
      if (this.mutedAuto) {
        this.mutedAuto = false;
        this.audio.muted = false; this.audio.volume = 0;
        if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
        this.fade(this.volume, this.reduced ? 0 : 1.2);
        this.say("");
      } else if (this.wanted && !this.playing) this.start(true);
    };
    ["pointerdown", "keydown", "touchend"].forEach(t => addEventListener(t, unlock, true));
  },

  // The analyser reads the real signal for the equalizer. If Web Audio isn't available the song still plays, just without bars.
  ensureAnalyser() {
    if (this.an || this.anFailed) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      const src = this.ctx.createMediaElementSource(this.audio);
      this.an = this.ctx.createAnalyser(); this.an.fftSize = 64; this.an.smoothingTimeConstant = 0.7;
      src.connect(this.an); this.an.connect(this.ctx.destination);
      this.data = new Uint8Array(this.an.frequencyBinCount);
    } catch { this.anFailed = true; this.an = null; }
  },

  restorePosition() {
    try {
      const s = JSON.parse(sessionStorage.getItem("pf:musicAt") || "null");
      if (s && s.i === this.index && s.t > 0 && this.audio.currentTime === 0) this.audio.currentTime = s.t;
    } catch {}
  },

  async start(quiet) {
    this.wanted = true; Model.setPref("musicOn", true);
    this.mutedAuto = false; this.audio.muted = false;
    // The analyser (only used for the equalizer) is created when the player is opened, not here: creating an AudioContext can
    // stall the page for a moment on some systems, and most visitors never open the player.
    if (this.open) this.ensureAnalyser();
    try {
      if (this.ctx && this.ctx.state === "suspended") await this.ctx.resume();
      this.restorePosition();
      this.say("Loading…");
      this.audio.volume = 0;
      await this.audio.play();
      this.playing = true;
      this.fade(this.volume, this.reduced ? 0 : 1.2);
      if (!quiet) Controller.play();
    } catch (e) {
      this.playing = false;
      if (e && e.name === "NotAllowedError") this.say("Your browser wants a click first. Press play.");
      else if (e && e.name !== "AbortError") this.say("That song didn't load. Press play to try again.");
    }
    this.sync();
  },

  stop() {
    this.wanted = false; Model.setPref("musicOn", false);
    this.playing = false;
    this.fade(0, this.reduced ? 0 : 0.5, () => this.audio.pause());
    this.sync();
  },

  fade(to, seconds, done) {
    if (this.fadeTween) this.fadeTween.kill();
    const a = this.audio;
    if (!seconds || !window.gsap) { a.volume = to; this.fadeTween = null; done && done(); return; }
    this.fadeTween = gsap.to(a, { volume: to, duration: seconds, ease: "power1.inOut", onComplete: () => { this.fadeTween = null; done && done(); } });
  },

  /* ---------- display ---------- */
  sync() {
    const on = this.playing && !this.audio.paused;
    this.btn.classList.toggle("playing", on);
    this.play.setAttribute("aria-label", on ? "Pause" : "Play");
    this.play.classList.toggle("is-playing", on);
    this.btn.title = on ? "Music playing (P pauses)" : "Music (P plays)";
    this.draw();
  },

  paint() {
    const a = this.audio, d = a.duration;
    this.cur.textContent = this.fmt(a.currentTime); this.dur.textContent = this.fmt(d);
    if (isFinite(d) && d > 0) { if (document.activeElement !== this.seek) this.seek.value = Math.round((a.currentTime / d) * 1000); }
    else if (document.activeElement !== this.seek) this.seek.value = 0;
    this.seek.setAttribute("aria-valuetext", this.fmt(a.currentTime) + " of " + this.fmt(d));
    if (a.currentTime > 0) try { sessionStorage.setItem("pf:musicAt", JSON.stringify({ i: this.index, t: a.currentTime })); } catch {}
  },

  draw() {
    cancelAnimationFrame(this.raf);
    if (!this.open) return;   // the equalizer is only visible while the player is open
    const c = this.viz, ctx = c.getContext("2d"), w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const live = this.open && this.playing && this.an && !this.reduced && !document.hidden;
    const cs = getComputedStyle(document.documentElement), lo = cs.getPropertyValue("--red").trim() || "#e60012", hi = document.documentElement.dataset.theme === "p5r" ? "#ffc61a" : "#ffffff";
    const n = 16, gap = 4, bw = (w - gap * (n - 1)) / n;
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      if (live) this.an.getByteFrequencyData(this.data);
      for (let i = 0; i < n; i++) {
        const v = live ? this.data[Math.min(this.data.length - 1, Math.floor(i * 1.6))] / 255 : 0.04;
        const bh = Math.max(3, v * h);
        ctx.fillStyle = i % 5 === 2 ? hi : lo;
        ctx.fillRect(i * (bw + gap), h - bh, bw, bh);
      }
      if (live && this.open && this.playing) this.raf = requestAnimationFrame(frame);
    };
    frame();
  },
};
