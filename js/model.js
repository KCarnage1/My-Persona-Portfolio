/* =====================================================================
   MODEL — the data and state of the app. Never touches the DOM.
   Edit your content here: featured projects, skills, image overrides.
   ===================================================================== */

const Model = {

  githubUser: "kcarnage1",

  // Where the contact form delivers (via formsubmit.co relay)
  contactEmail: "rajesholbis@gmail.com",

  // App state (read/written by the Controller, displayed by the View)
  state: {
    screen: "home",        // which screen is showing
    menuIndex: 0,          // selected item on the home menu
    reposLoaded: false,
    skillsBuilt: false,
  },

  // ---- Featured projects (hand-written, shown above the GitHub feed) ----
  // TODO: replace each url with the project's own repository link.
  // Until then each card opens your GitHub profile.
  featured: [
    {
      title: "CLOUD TASK MANAGER",
      tag: "Full-Stack", color: "#3dc8ff",
      url: "https://github.com/kcarnage1", cta: "View on GitHub →",
      img: "assets/projects/task-manager.png",
      desc: "Full-stack task manager with user accounts, task creation and status tracking. Built with HTML, CSS, JavaScript and a Java backend, deployed on a cloud virtual machine with input validation and access control.",
    },
    {
      title: "CLOUD BACKUP TOOL",
      tag: "Python", color: "#3572A5",
      url: "https://github.com/kcarnage1", cta: "View on GitHub →",
      img: "assets/projects/backup-tool.png",
      desc: "Python script that watches a folder, compresses new files and uploads them to cloud storage on a schedule. Keeps a log and retries failed uploads so nothing gets lost quietly.",
    },
    {
      title: "SERVER MONITORING DASHBOARD",
      tag: "Dashboard", color: "#f1e05a",
      url: "https://github.com/kcarnage1", cta: "View on GitHub →",
      img: "assets/projects/monitoring-dashboard.png",
      desc: "Tracks CPU, memory and disk usage on a server and shows it as live charts in the browser. Python collects the data; the front end is JavaScript, HTML and CSS.",
    },
    {
      title: "LIBRARY MANAGEMENT SYSTEM",
      tag: "Java", color: "#b07219",
      url: "https://github.com/kcarnage1", cta: "View on GitHub →",
      img: "assets/projects/library-system.png",
      desc: "Java program for managing books, members and loans, built around object-oriented design with file-based storage. Core logic was also rewritten in C++ to compare structure and memory handling.",
    },
  ],

  // Repo names (exactly as on GitHub) that are already shown in "featured",
  // so they get hidden from the GitHub feed. Fill these in once you have
  // the real repository names, e.g. ["cloud-task-manager", "backup-tool"].
  featuredRepoNames: [],

  // Shown if the GitHub API can't be reached (leave empty or add your own)
  fallbackRepos: [],

  // Optional thumbnail overrides: repo name → image path.
  // Anything not listed is looked up at assets/projects/<RepoName>.png
  projectImages: {
    // "my-repo": "assets/projects/my-repo.png",
  },

  langColors: {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    Java: "#b07219", "C++": "#f34b7d", C: "#555", HTML: "#e34c26",
    CSS: "#663399", Shell: "#89e051", Dockerfile: "#384d54",
    "Jupyter Notebook": "#DA5B0B", PHP: "#4F5D95",
  },

  // ---- Skills screen ----
  // The numbers (0–100) only set the bar length. Your CV doesn't give
  // levels, so these are rough estimates: adjust them to what feels right.
  skills: [
    { group: "Languages", items: [
      ["Python", 75], ["Java", 70],
      ["JavaScript", 68], ["HTML · CSS", 72],
      ["C++", 60],
    ]},
    { group: "Cloud & Systems", items: [
      ["Git & GitHub", 75], ["Linux Command Line", 65],
      ["Cloud Virtual Machines", 62], ["Cloud Storage", 58],
      ["Networking Basics", 50],
    ]},
    { group: "Building", items: [
      ["Full-Stack Web Apps", 65], ["Backend Systems", 62],
      ["Automation & Scripting", 70], ["Monitoring Dashboards", 60],
    ]},
  ],

  // ---- Data fetching ----
  async fetchRepos() {
    const skip = new Set(this.featuredRepoNames);
    try {
      const res = await fetch(
        `https://api.github.com/users/${this.githubUser}/repos?per_page=100&sort=updated`
      );
      if (!res.ok) throw new Error(res.status);
      const repos = (await res.json()).filter(r => !r.fork && !skip.has(r.name));
      return { repos, live: true };
    } catch {
      return { repos: this.fallbackRepos.filter(r => !skip.has(r.name)), live: false };
    }
  },
};
