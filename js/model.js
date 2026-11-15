/* MODEL — data and state only. Never touches the DOM. */
const Model = {
  githubUser: "KCarnage1",
  contactEmail: "rajesholbis@gmail.com",   // contact form target (formsubmit.co relay)

  state: { screen: "home", menuIndex: 0, reposLoaded: false, skillsBuilt: false, aboutBuilt: false, projectsBuilt: false, filter: "all", modal: -1 },
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
    { id: "small", label: "Smaller builds" },
  ],

  /* ---------- projects ----------
     To add one: copy a block below. `links` is a list of buttons ({ label, url, primary }).
     `img` (optional) = a screenshot path like "assets/projects/name.jpg"; without it the card draws its own cover.
     `cat` decides which filter it shows under. Projects with cat "small" go in the "Smaller builds" group. */
  projects: [
    {
      id: "jiran-connect", repo: "jiran-connect", cat: "web", year: "2026", color: "#18c29c", cover: "JIRAN",
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
      id: "portfolio", repo: "My-Persona-Portfolio", cat: "web", year: "2026", color: "#e60012", cover: "THIS SITE",
      title: "PERSONA PORTFOLIO", tag: "Vanilla JS",
      desc: "The site you're on. A Persona 3/5-inspired portfolio in plain HTML, CSS and JavaScript, with no framework and no build step.",
      highlights: [
        "Model / View / Controller split in plain JavaScript.",
        "An animated canvas background for every section, with mouse parallax.",
        "Hash routing, so back and forward buttons and deep links like #about work.",
        "Live GitHub repository feed with a 10-minute cache.",
        "Full keyboard control (arrows, number keys, Q/E tabs, Esc) and reduced-motion support.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Canvas", "GitHub API"],
      links: [{ label: "Code", url: "https://github.com/KCarnage1/My-Persona-Portfolio", primary: true }],
    },

    // smaller builds (no public repo yet → card shows "Repo coming soon")
    { id: "task-manager", cat: "small", color: "#3dc8ff", cover: "TASKS", title: "CLOUD TASK MANAGER", tag: "Full-Stack",
      desc: "Full-stack task manager with user accounts, task creation and status tracking. HTML, CSS, JavaScript and a Java backend, deployed on a cloud virtual machine with input validation and access control." },
    { id: "backup-tool", cat: "small", color: "#3572A5", cover: "BACKUP", title: "CLOUD BACKUP TOOL", tag: "Python",
      desc: "Python script that watches a folder, compresses new files and uploads them to cloud storage on a schedule. Keeps a log and retries failed uploads so nothing gets lost quietly." },
    { id: "monitoring", cat: "small", color: "#e8a33d", cover: "MONITOR", title: "SERVER MONITORING DASHBOARD", tag: "Dashboard",
      desc: "Tracks CPU, memory and disk usage on a server and shows it as live charts in the browser. Python collects the data; the front end is JavaScript, HTML and CSS." },
    { id: "library", cat: "small", color: "#b07219", cover: "LIBRARY", title: "LIBRARY MANAGEMENT SYSTEM", tag: "Java",
      desc: "Java program for managing books, members and loans with object-oriented design and file-based storage. Core logic was also rewritten in C++ to compare structure and memory handling." },
  ],

  hiddenRepos: ["KCarnage1"],   // repos never shown in the live feed (profile README etc.)
  langColors: { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555", HTML: "#e34c26", CSS: "#663399", Shell: "#89e051", Lua: "#000080", Luau: "#00a2ff", Dockerfile: "#384d54", "Jupyter Notebook": "#DA5B0B", PHP: "#4F5D95" },

  skills: [
    { group: "Languages", items: [["Python", 75], ["Java", 70], ["JavaScript", 72], ["TypeScript", 58], ["HTML · CSS", 78], ["C++", 60]] },
    { group: "Cloud & Systems", items: [["Git & GitHub", 78], ["Linux Command Line", 65], ["Cloud Virtual Machines", 62], ["Cloud Storage", 58], ["Supabase · PostgreSQL", 55], ["Networking Basics", 50]] },
    { group: "Building", items: [["Full-Stack Web Apps", 70], ["React · Next.js", 58], ["Desktop Apps (Electron)", 60], ["Backend Systems", 62], ["Automation & Scripting", 70], ["Game Modding", 55]] },
  ],

  // **double asterisks** become highlights. First item is the lead paragraph.
  about: [
    "I'm an undergraduate majoring in **Information Technology,** mostly interested in **software development and cloud engineering.** I like knowing what actually happens behind an app, from the code you see on screen to the servers keeping it online.",
    "I learn best by **building something, breaking it, and working out why it broke.** Most of what I know came from small projects where I got stuck, looked things up, and eventually got them working.",
    "Right now I'm interested in **cloud infrastructure, web development, backend systems, and automation.** I especially like projects where I can take a rough idea and turn it into something people can really use.",
    "Lately I've been shipping bigger things: **Jiran Connect,** a bilingual community platform built with Next.js and Supabase, and **Five Nights at Zayed's,** a desktop horror game with online multiplayer over WebRTC. You can find both in the Projects section.",
    "One of my earlier projects is a **cloud-hosted task manager**: a full-stack app with user accounts, task creation, and status tracking, built with HTML, CSS, JavaScript, and a Java backend, then deployed on a cloud virtual machine. Setting up the server myself taught me more than the coding did, and I added basic input validation and access control along the way.",
    "I also built an **automated cloud backup tool**, a Python script that watches a folder, compresses new files, and uploads them to cloud storage on a schedule. It keeps a log and retries failed uploads, so nothing gets lost quietly. It was my first proper experience with a cloud storage API.",
    "Another is a **server monitoring dashboard** that tracks CPU, memory, and disk usage and shows it as live charts in the browser. Python collects the data, and the front end is JavaScript, HTML, and CSS.",
    "I also made a **library management system** in Java for managing books, members, and loans, built around object-oriented design with file-based storage. I rewrote the core logic in C++ to see how the two languages differ in structure and memory handling.",
    "Languages and tools I've worked with include **Python, C++, Java, JavaScript, TypeScript, HTML, CSS, Git and GitHub, VS Code, the Linux command line,** and the basics of cloud platforms such as **virtual machines, storage, and networking.**",
    "I'd say **problem-solving and consistency** are my strongest qualities. When something breaks, I'd rather find the real cause than patch over it, even if that takes longer.",
    "I also value **curiosity, independent learning, clear communication, teamwork,** and helping others when I can.",
    "Outside academics, I like **gaming,** mainly because a good game is just a long series of problems to figure out, and **swimming,** which helps me stay active and clear my head.",
    { quote: "The important thing is not to stop questioning.", by: "Albert Einstein" },
    "Right now I'm building up my fundamentals in **cloud engineering:** how applications get deployed, scaled, and kept secure. I'm planning a personal project that deploys a web app from start to finish with automated deployment and monitoring, so I can practise this in a real setup instead of just reading about it.",
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
