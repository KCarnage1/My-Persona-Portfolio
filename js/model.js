/* MODEL — data and state only. Never touches the DOM. */
const Model = {
  githubUser: "kcarnage1",
  contactEmail: "rajesholbis@gmail.com",   // contact form target (formsubmit.co relay)

  state: { screen: "home", menuIndex: 0, reposLoaded: false, skillsBuilt: false, aboutBuilt: false },
  screens: ["home", "projects", "skills", "about", "contact"],

  // TODO: swap each url for the project's own repo link
  featured: [
    { title: "CLOUD TASK MANAGER", tag: "Full-Stack", color: "#3dc8ff", url: "https://github.com/kcarnage1", cta: "View on GitHub →", img: "assets/projects/task-manager.png",
      desc: "Full-stack task manager with user accounts, task creation and status tracking. HTML, CSS, JavaScript and a Java backend, deployed on a cloud virtual machine with input validation and access control." },
    { title: "CLOUD BACKUP TOOL", tag: "Python", color: "#3572A5", url: "https://github.com/kcarnage1", cta: "View on GitHub →", img: "assets/projects/backup-tool.png",
      desc: "Python script that watches a folder, compresses new files and uploads them to cloud storage on a schedule. Keeps a log and retries failed uploads so nothing gets lost quietly." },
    { title: "SERVER MONITORING DASHBOARD", tag: "Dashboard", color: "#f1e05a", url: "https://github.com/kcarnage1", cta: "View on GitHub →", img: "assets/projects/monitoring-dashboard.png",
      desc: "Tracks CPU, memory and disk usage on a server and shows it as live charts in the browser. Python collects the data; the front end is JavaScript, HTML and CSS." },
    { title: "LIBRARY MANAGEMENT SYSTEM", tag: "Java", color: "#b07219", url: "https://github.com/kcarnage1", cta: "View on GitHub →", img: "assets/projects/library-system.png",
      desc: "Java program for managing books, members and loans with object-oriented design and file-based storage. Core logic was also rewritten in C++ to compare structure and memory handling." },
  ],

  featuredRepoNames: [],      // exact repo names to hide from the live feed
  projectImages: {},          // optional: "repo-name": "assets/projects/x.png"
  langColors: { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", "C++": "#f34b7d", C: "#555", HTML: "#e34c26", CSS: "#663399", Shell: "#89e051", Dockerfile: "#384d54", "Jupyter Notebook": "#DA5B0B", PHP: "#4F5D95" },

  skills: [
    { group: "Languages", items: [["Python", 75], ["Java", 70], ["JavaScript", 68], ["HTML · CSS", 72], ["C++", 60]] },
    { group: "Cloud & Systems", items: [["Git & GitHub", 75], ["Linux Command Line", 65], ["Cloud Virtual Machines", 62], ["Cloud Storage", 58], ["Networking Basics", 50]] },
    { group: "Building", items: [["Full-Stack Web Apps", 65], ["Backend Systems", 62], ["Automation & Scripting", 70], ["Monitoring Dashboards", 60]] },
  ],

  // **double asterisks** become highlights. First item is the lead paragraph.
  about: [
    "I'm an undergraduate majoring in **Information Technology,** mostly interested in **software development and cloud engineering.** I like knowing what actually happens behind an app, from the code you see on screen to the servers keeping it online.",
    "I learn best by **building something, breaking it, and working out why it broke.** Most of what I know came from small projects where I got stuck, looked things up, and eventually got them working.",
    "Right now I'm interested in **cloud infrastructure, web development, backend systems, and automation.** I especially like projects where I can take a rough idea and turn it into something people can really use.",
    "One of my projects is a **cloud-hosted task manager**: a full-stack app with user accounts, task creation, and status tracking, built with HTML, CSS, JavaScript, and a Java backend, then deployed on a cloud virtual machine. Setting up the server myself taught me more than the coding did, and I added basic input validation and access control along the way.",
    "I also built an **automated cloud backup tool**, a Python script that watches a folder, compresses new files, and uploads them to cloud storage on a schedule. It keeps a log and retries failed uploads, so nothing gets lost quietly. It was my first proper experience with a cloud storage API.",
    "Another is a **server monitoring dashboard** that tracks CPU, memory, and disk usage and shows it as live charts in the browser. Python collects the data, and the front end is JavaScript, HTML, and CSS.",
    "I also made a **library management system** in Java for managing books, members, and loans, built around object-oriented design with file-based storage. I rewrote the core logic in C++ to see how the two languages differ in structure and memory handling.",
    "Languages and tools I've worked with include **Python, C++, Java, JavaScript, HTML, CSS, Git and GitHub, VS Code, the Linux command line,** and the basics of cloud platforms such as **virtual machines, storage, and networking.**",
    "I'd say **problem-solving and consistency** are my strongest qualities. When something breaks, I'd rather find the real cause than patch over it, even if that takes longer.",
    "I also value **curiosity, independent learning, clear communication, teamwork,** and helping others when I can.",
    "Outside academics, I like **gaming,** mainly because a good game is just a long series of problems to figure out, and **swimming,** which helps me stay active and clear my head.",
    { quote: "The important thing is not to stop questioning.", by: "Albert Einstein" },
    "Right now I'm building up my fundamentals in **cloud engineering:** how applications get deployed, scaled, and kept secure. I'm planning a personal project that deploys a web app from start to finish with automated deployment and monitoring, so I can practise this in a real setup instead of just reading about it.",
  ],

  // Live GitHub feed, cached for 10 minutes so revisits are instant and rate limits stay happy
  async fetchRepos() {
    const skip = new Set(this.featuredRepoNames), key = "repos:" + this.githubUser, ttl = 6e5;
    try {
      const c = JSON.parse(sessionStorage.getItem(key) || "null");
      if (c && Date.now() - c.t < ttl) return { repos: c.repos.filter(r => !skip.has(r.name)), live: true };
    } catch {}
    try {
      const res = await fetch(`https://api.github.com/users/${this.githubUser}/repos?per_page=100&sort=updated`);
      if (!res.ok) throw new Error(res.status);
      const all = (await res.json()).filter(r => !r.fork);
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), repos: all })); } catch {}
      return { repos: all.filter(r => !skip.has(r.name)), live: true };
    } catch { return { repos: [], live: false }; }
  },
};
