/* MODEL: data and state only. Never touches the DOM. */
const Model = {
  githubUser: "KCarnage1",
  contactEmail: "rajesholbis@gmail.com",   // contact form target (formsubmit.co relay)

  state: { project: 0, skillGroup: 0, skill: 0, screen: "home", menuIndex: 0, reposLoaded: false, skillsBuilt: false, aboutBuilt: false, projectsBuilt: false, filter: "all", modal: -1, motion: true },
  screens: ["home", "projects", "skills", "about", "contact"],
  sections: ["projects", "skills", "about", "contact"],
  captions: {
    projects: "Things I've built and shipped",
    skills: "What I work with",
    about: "Who I am",
    contact: "Get in touch",
  },

  categories: [
    { id: "all", label: "All" },
    { id: "web", label: "Web" },
    { id: "game", label: "Games" },
    { id: "mod", label: "Mods" },
    { id: "tool", label: "Tools" },
  ],

  /* ---------- projects ----------
     To add one: copy a block below. `links` is a list of buttons ({ label, url, primary }).
     `img` (optional) = a screenshot path like "assets/projects/name.jpg"; without it the card draws its own cover.
     `cat` decides which filter it shows under: web, game, mod or tool. A project with cat "small" would go in a "Smaller builds" group instead. */
  projects: [
    {
      id: "jiran-connect", repo: "jiran-connect", cat: "web", year: "2026", color: "#18c29c", cover: "JIRAN",
      shots: [
        { src: "assets/projects/jiran-connect-1.jpg", alt: "Jiran Connect landing page in English" },
        { src: "assets/projects/jiran-connect-2.jpg", alt: "The same landing page in Arabic, laid out right to left" },
        { src: "assets/projects/jiran-connect-3.jpg", alt: "Sign-in screen in Arabic with the demo account filled in" }],
      title: "JIRAN CONNECT", tag: "Next.js · TypeScript",
      desc: "Privacy-first UAE community platform that connects locals and newcomers through verified majlis, real gatherings and cultural exchange. Arabic-first, fully bilingual, with a custom Glass UI.",
      highlights: [
        "Next.js 16 App Router with React 19 and strict TypeScript, styled with Tailwind CSS v4 design tokens.",
        "Arabic and English with full right-to-left support: layouts use CSS logical properties, so every screen mirrors without a second stylesheet.",
        "Supabase schema with row-level security on every table, an append-only moderation log and race-safe RSVPs that auto-waitlist at capacity.",
        "Hash-only identity verification flow: ID numbers are stored only as salted SHA-256 hashes, never in plain text.",
        "Admin and moderation dashboard with role-based access and live stats charts.",
        "Exported as a static site and deployed to GitHub Pages by a GitHub Actions workflow on every push.",
      ],
      stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Framer Motion", "Leaflet"],
      links: [
        { label: "Live demo", url: "https://kcarnage1.github.io/jiran-connect/", primary: true },
        { label: "Code", url: "https://github.com/KCarnage1/jiran-connect" },
      ],
    },
    {
      id: "fnaz", repo: "FiveNightsAtZayeds", cat: "game", year: "2026", color: "#9b5cff", cover: "5 NIGHTS",
      shots: [
        { src: "assets/projects/fnaz-1.jpg", alt: "Five Nights at Zayed's main menu" },
        { src: "assets/projects/fnaz-2.jpg", alt: "The newspaper intro shown before night 1" }],
      title: "FIVE NIGHTS AT ZAYED'S", tag: "Electron · JavaScript",
      desc: "Desktop horror game: survive five nights as Rashid at Salem's Candy. A canvas and JavaScript game engine packaged with Electron, with online co-op and versus modes.",
      highlights: [
        "Custom canvas/JavaScript game engine bundled into an Electron desktop app, with builds for Windows and macOS (Intel and Apple Silicon).",
        "Online play over WebRTC peer-to-peer: co-op guards sharing one office, or guard vs. a player-controlled animatronic, joined with a 4-letter room code.",
        "In-game chat and quick messages during online matches.",
        "Locked-down preload bridge (contextBridge), so the game page never touches Node directly.",
        "Adjustable frame-rate cap, Discord Rich Presence, and a self-test mode that checks every sound and video file decodes before release.",
      ],
      stack: ["JavaScript", "Electron", "Canvas", "WebRTC", "PeerJS", "Node.js"],
      links: [
        { label: "Download", url: "https://github.com/KCarnage1/FiveNightsAtZayeds/releases", primary: true },
        { label: "Code", url: "https://github.com/KCarnage1/FiveNightsAtZayeds" },
      ],
    },
    {
      id: "ultraniko", repo: "UltraNiko-Updated", cat: "mod", year: "2026", color: "#f5c518", cover: "NIKO",
      shots: [{ src: "assets/projects/ultraniko-1.jpg", alt: "The mod's icon: a Niko plush holding a light bulb" }],
      title: "ULTRANIKO UPDATED", tag: "ULTRAKILL mod",
      desc: "A recode of an old ULTRAKILL mod that swaps the red and blue skulls, soap, rockets, torches and landmines for a Niko plush, built on top of the UltraFumos mod.",
      highlights: [
        "Reworked an older community mod so it can be used again.",
        "Replaces six in-game item types with Niko plush models while keeping all of UltraFumos' features.",
        "In-game settings through PluginConfigurator.",
        "Full credits for the original code and every 3D model, including the CC BY 4.0 licensed scans.",
      ],
      stack: ["Unity", "C#", "Modding", "3D assets"],
      links: [{ label: "Code", url: "https://github.com/KCarnage1/UltraNiko-Updated", primary: true }],
    },
    {
      id: "portfolio", repo: "My-Persona-Portfolio", cat: "web", year: "2026", color: "#e60012", ink: "#fff", cover: "THIS SITE",
      shots: [
        { src: "assets/projects/portfolio-1.jpg", alt: "This portfolio's main menu with the Persona 3-style calendar" },
        { src: "assets/projects/portfolio-2.jpg", alt: "The Skills screen with its hexagon chart" },
        { src: "assets/projects/portfolio-3.jpg", alt: "The Projects select screen" }],
      title: "PERSONA PORTFOLIO", tag: "Vanilla JS",
      desc: "The site you're on. A Persona 3/5-inspired portfolio in plain HTML, CSS and JavaScript, with no framework and no build step.",
      highlights: [
        "Model / View / Controller split in plain JavaScript.",
        "An animated canvas background for every section, with mouse parallax.",
        "Hash routing, so back and forward buttons and deep links like #about work.",
        "Live GitHub repository feed with a 10-minute cache.",
        "Full keyboard control (arrows, number keys, Q/E tabs, a / quick-jump menu, Esc) and reduced-motion support.",
        "A Persona 3-style calendar on the home screen that shows the real date, time of day and moon phase.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Canvas", "GSAP", "GitHub API"],
      links: [{ label: "Code", url: "https://github.com/KCarnage1/My-Persona-Portfolio", primary: true }],
    },

    {
      id: "task-manager", repo: "cloud-task-manager", cat: "web", year: "2026", color: "#2dd4bf", cover: "TASKS",
      shots: [
        { src: "assets/projects/task-manager-1.jpg", alt: "The task board with Waiting, In progress and Finished columns" },
        { src: "assets/projects/task-manager-2.jpg", alt: "The same board in dark mode" },
        { src: "assets/projects/task-manager-3.jpg", alt: "The edit dialog for a task" }],
      title: "CLOUD TASK MANAGER", tag: "Java · JavaScript",
      desc: "Full-stack task manager with user accounts, task creation and status tracking. A Java backend with no framework serves a plain HTML, CSS and JavaScript front end, with deployment files for a cloud VM.",
      highlights: [
        "Accounts with PBKDF2 password hashing, hashed server-side sessions in HttpOnly SameSite cookies, and login rate limiting.",
        "Access control: every query is scoped to the signed-in user, and someone else's task answers 404 so IDs can't be probed.",
        "Server-side validation with a message per field, JSON-only bodies capped at 64 KB, and a strict Content-Security-Policy.",
        "Every status change is recorded with a timestamp and shown in the task's history.",
        "21 automated checks, including HTTP tests for sessions, cross-site requests, rate limits and cross-user access.",
        "Dockerfile, systemd unit and Caddy config for a cloud VM. Built and tested locally; the deployment files are untested on a real VM.",
      ],
      stack: ["Java 21", "JDK HTTP server", "JavaScript", "HTML", "CSS", "Docker", "systemd", "Caddy"],
      links: [{ label: "Code", url: "https://github.com/KCarnage1/cloud-task-manager", primary: true }],
    },
    {
      id: "backup-tool", repo: "cloud-backup-tool", cat: "tool", year: "2026", color: "#38bdf8", cover: "BACKUP",
      shots: [{ src: "assets/projects/backup-tool-1.jpg", alt: "Terminal output: a backup pass, a failed upload retried with backoff, then a restore" }],
      title: "CLOUD BACKUP TOOL", tag: "Python",
      desc: "Watches a folder, compresses new and changed files and uploads them on a schedule. It keeps a log and retries failed uploads, so nothing gets lost quietly.",
      highlights: [
        "Change detection by size and modification time first, then SHA-256, so a touched but unchanged file isn't uploaded again.",
        "Retries with capped exponential backoff and jitter. A file that still fails stays queued with its last error and is retried on the next pass.",
        "Storage is pluggable: any folder, or an S3-compatible server such as a self-hosted MinIO. No paid service needed.",
        "Restore checks each file against the SHA-256 stored with it and refuses paths that would escape the restore folder.",
        "Found and fixed two failure-handling bugs by running it against broken storage; both have regression tests.",
        "30 tests, including the S3 backend against a mocked server.",
      ],
      stack: ["Python 3.11", "gzip", "SHA-256", "TOML", "S3 API", "pytest"],
      links: [{ label: "Code", url: "https://github.com/KCarnage1/cloud-backup-tool", primary: true }],
    },
    {
      id: "monitoring", repo: "server-monitoring-dashboard", cat: "web", year: "2026", color: "#4ade80", cover: "MONITOR",
      shots: [
        { src: "assets/projects/monitoring-1.jpg", alt: "The dashboard showing alerts, CPU with per-core load, and memory" },
        { src: "assets/projects/monitoring-2.jpg", alt: "Network and disk activity charts above the disk space bars" }],
      title: "SERVER MONITORING DASHBOARD", tag: "Python · JavaScript",
      desc: "Tracks CPU, memory and disk usage on a server and shows it as live charts in the browser. Python collects the data; the front end is plain JavaScript, HTML and CSS drawing to canvas.",
      highlights: [
        "Readings stream to the page over Server-Sent Events, and the header says Live, Paused or Stale if readings stop.",
        "Each metric shows OK, WARN or CRIT as a word as well as a colour, and alerts come first on the page.",
        "Read-only image filesystems are left out, because they are always full and would raise permanent false alarms.",
        "Binds to localhost by default, refuses a public address without a token, checks the Host header against DNS rebinding, and sends a strict CSP.",
        "Charts are drawn on canvas with no libraries, with text summaries for screen readers.",
        "25 Python tests and 7 JavaScript tests.",
      ],
      stack: ["Python", "psutil", "Server-Sent Events", "JavaScript", "Canvas", "HTML", "CSS"],
      links: [{ label: "Code", url: "https://github.com/KCarnage1/server-monitoring-dashboard", primary: true }],
    },
    {
      id: "library", repo: "library-management-system", cat: "tool", year: "2026", color: "#fb923c", cover: "LIBRARY",
      shots: [{ src: "assets/projects/library-1.jpg", alt: "Terminal output: listing books, borrowing, a refused second copy, an invalid ISBN and a return" }],
      title: "LIBRARY MANAGEMENT SYSTEM", tag: "Java · C++",
      desc: "Command-line desk for books, members and loans, built around object-oriented design with file-based storage. The core rules were also rewritten in C++ to compare structure and memory handling.",
      highlights: [
        "Rules in one class: 14-day loans, 3 books per member, 25 cent a day late fee capped at $10, and overdue books block new loans.",
        "ISBN-10 and ISBN-13 with check-digit validation.",
        "Tab-separated storage written to a temp file and moved into place, so a crash can't leave a half-written catalogue.",
        "The C++20 port uses value types and RAII with no raw new, and runs clean under AddressSanitizer and UBSan.",
        "11 Java tests and 8 C++ tests share the same scenarios; CI runs both.",
      ],
      stack: ["Java 21", "C++20", "CMake", "ASan / UBSan"],
      links: [{ label: "Code", url: "https://github.com/KCarnage1/library-management-system", primary: true }],
    },
  ],

  hiddenRepos: ["KCarnage1"],   // repos never shown in the live feed (profile README etc.)
  langColors: { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555", HTML: "#e34c26", CSS: "#663399", Shell: "#89e051", Lua: "#000080", Luau: "#00a2ff", Dockerfile: "#384d54", "Jupyter Notebook": "#DA5B0B", PHP: "#4F5D95" },

  // Self-rated levels out of 100. `short` is the label on the hexagon chart; `uses` lists project ids where the skill was used.
  // Rank on screen is derived from the level: under 50 = 1, 50s = 2, 60s = 3, 70s = 4, 80+ = 5.
  skills: [
    { group: "Languages", blurb: "What I write code in.", items: [
      { name: "Python", short: "Python", v: 75, uses: ["backup-tool", "monitoring"] },
      { name: "Java", short: "Java", v: 70, uses: ["task-manager", "library"] },
      { name: "JavaScript", short: "JS", v: 72, uses: ["fnaz", "portfolio", "monitoring", "task-manager"] },
      { name: "TypeScript", short: "TS", v: 58, uses: ["jiran-connect"] },
      { name: "HTML · CSS", short: "HTML/CSS", v: 78, uses: ["portfolio", "jiran-connect", "task-manager", "monitoring"] },
      { name: "C++", short: "C++", v: 60, uses: ["library"] }] },
    { group: "Cloud & Systems", blurb: "Where the code runs and how it gets there.", items: [
      { name: "Git & GitHub", short: "Git", v: 78, uses: ["jiran-connect", "fnaz", "ultraniko", "portfolio", "task-manager", "backup-tool", "monitoring", "library"] },
      { name: "Linux Command Line", short: "Linux", v: 65, uses: ["backup-tool", "monitoring", "task-manager"] },
      { name: "Cloud Virtual Machines", short: "VMs", v: 62, uses: ["task-manager"] },
      { name: "Cloud Storage", short: "Storage", v: 58, uses: ["backup-tool"] },
      { name: "Supabase · PostgreSQL", short: "Postgres", v: 55, uses: ["jiran-connect"] },
      { name: "Networking Basics", short: "Network", v: 50, uses: ["fnaz", "monitoring"] }] },
    { group: "Building", blurb: "The kinds of things I make.", items: [
      { name: "Full-Stack Web Apps", short: "Full-stack", v: 70, uses: ["jiran-connect", "task-manager", "monitoring"] },
      { name: "React · Next.js", short: "React", v: 58, uses: ["jiran-connect"] },
      { name: "Desktop Apps (Electron)", short: "Desktop", v: 60, uses: ["fnaz"] },
      { name: "Backend Systems", short: "Backend", v: 62, uses: ["task-manager", "monitoring"] },
      { name: "Automation & Scripting", short: "Scripts", v: 70, uses: ["backup-tool"] },
      { name: "Game Modding", short: "Modding", v: 55, uses: ["ultraniko"] }] },
  ],
  rank: v => (v >= 80 ? 5 : v >= 70 ? 4 : v >= 60 ? 3 : v >= 50 ? 2 : 1),

  // About, in chapters. **double asterisks** become highlights; the first paragraph is the lead.
  about: [
    { h: "Who I am", items: [
      "I'm an undergraduate majoring in **Information Technology,** mostly interested in **software development and cloud engineering.** I like knowing what actually happens behind an app, from the code you see on screen to the servers keeping it online.",
      "I learn best by **building something, breaking it, and working out why it broke.** Most of what I know came from small projects where I got stuck, looked things up, and eventually got them working.",
    ] },
    { h: "What I've built", items: [
      "Lately I've been shipping bigger things: **Jiran Connect,** a bilingual community platform built with Next.js and Supabase, and **Five Nights at Zayed's,** a desktop horror game with online multiplayer over WebRTC.",
      "Alongside those are four smaller systems, each with its own repo and tests: a **cloud task manager** with a Java backend, an **automated backup tool** in Python, a **server monitoring dashboard** with live charts, and a **library management system** in Java that I rewrote in C++ to compare the two. Building the backup tool taught me to test against broken storage, because that's where the bugs were.",
    ] },
    { h: "How I work", items: [
      "I'd say **problem-solving and consistency** are my strongest qualities. When something breaks, I'd rather find the real cause than patch over it, even if that takes longer.",
      "I also value **curiosity, independent learning, clear communication and teamwork,** and I help others when I can.",
      { quote: "The important thing is not to stop questioning.", by: "Albert Einstein" },
    ] },
    { h: "Right now", items: [
      "I'm building up my fundamentals in **cloud engineering:** how applications get deployed, scaled and kept secure. Next I want to deploy a web app from start to finish with automated deployment and monitoring, so I practise this in a real setup instead of only reading about it.",
      "Outside of code I like **gaming,** because a good game is a long series of problems to figure out, and **swimming,** which keeps me active and clears my head.",
    ] },
  ],

  /* ---------- preferences (per browser) ---------- */
  pref(key, fallback) { try { const v = localStorage.getItem("pf:" + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  setPref(key, v) { try { localStorage.setItem("pf:" + key, JSON.stringify(v)); } catch {} },

  // Live GitHub feed, cached for 10 minutes so revisits are instant and rate limits stay happy
  async fetchRepos() {
    const skip = new Set([...this.hiddenRepos, ...this.projects.map(p => p.repo).filter(Boolean)].map(s => s.toLowerCase()));
    const keep = list => list.filter(r => !skip.has(r.name.toLowerCase()));
    const key = "repos:" + this.githubUser, ttl = 6e5;
    try {
      const c = JSON.parse(sessionStorage.getItem(key) || "null");
      if (c && Date.now() - c.t < ttl) return { repos: keep(c.repos), live: true };
    } catch {}
    try {
      const res = await fetch(`https://api.github.com/users/${this.githubUser}/repos?per_page=100&sort=pushed`);
      if (!res.ok) throw new Error(res.status);
      const all = (await res.json()).filter(r => !r.fork).map(r => ({
        name: r.name, full_name: r.full_name, html_url: r.html_url, description: r.description,
        language: r.language, stargazers_count: r.stargazers_count, pushed_at: r.pushed_at, homepage: r.homepage,
      }));
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), repos: all })); } catch {}
      return { repos: keep(all), live: true };
    } catch { return { repos: [], live: false }; }
  },
};
