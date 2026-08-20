// API service — all calls go to Vercel serverless functions (/api/*)
// No external backend dependency

export const API_BASE = "";
export const API_WS = "";
const KEY_STORE = "pulseops_api_key";

const FALLBACK_PROFILE = {
  name: "Anshul Rawat",
  title: "Full Stack Developer",
  tagline: "I build fast, resilient web apps. From pixel-perfect React frontends to async FastAPI backends with Docker, Redis and real observability.",
  summary: "Full Stack Developer with hands-on experience building scalable, high-performance, responsive web apps. Skilled in React.js, FastAPI, PostgreSQL, Docker, CI/CD and modern DevOps practices.",
  about: ["I build fast, resilient web apps.", "I turn ideas into products that feel fast and never break."],
  phone: "+91 9953540593",
  email: "anshulrawat5124@gmail.com",
  location: "Faridabad, Haryana, India",
  links: {
    github: "https://github.com/Anshul1023",
    linkedin: "https://www.linkedin.com/in/anshul-rawat-235019290",
    portfolio: "https://anshul-rawat-portfolio.vercel.app"
  },
  skills: ["React.js", "JavaScript (ES6+)", "TypeScript", "HTML5", "CSS3", "Vite", "Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
  experience: [
    { role: "Full Stack Developer", company: "Odds Fitness", period: "2025 — Present", points: ["Built production React + FastAPI features used by real users", "Implemented AI-powered content generation using RAG, vector search, and LLM agents", "Set up Docker, Redis caching, and Prometheus + Grafana monitoring", "Designed RESTful APIs with PostgreSQL, async Python, and WebSockets"] },
    { role: "Frontend Developer", company: "SGS Onsite Solutions", period: "2024 — 2025", points: ["Developed responsive dashboards and client-facing web apps using React + TypeScript", "Integrated third-party APIs with Redux and Context API state management", "Improved performance by 40% through code splitting and lazy loading", "Collaborated with design teams for pixel-perfect UI from Figma mockups"] },
    { role: "Web Development Intern", company: "Interpe Inc", period: "2023 — 2024", points: ["Built landing pages using HTML, CSS, JavaScript, and React", "Learned Git workflows, code reviews, and agile sprint methodology", "Contributed to open-source projects and gained CI/CD experience"] }
  ],
  projects: [],
  education: [{ degree: "Bachelor of Technology in Computer Science", school: "Manav Rachna University, Faridabad", period: "2021 — 2025" }],
  languages: ["Hindi", "English"]
};

export function getApiKey() { return localStorage.getItem(KEY_STORE) || "" }
export function setApiKey(k) { k ? localStorage.setItem(KEY_STORE, k) : localStorage.removeItem(KEY_STORE) }
export function isOwner() { return !!(getApiKey() || localStorage.getItem("pulseops_owner_email") || localStorage.getItem("pulseops_jwt")) }

// Local fetch helpers — hit /api/* serverless functions
async function localGet(path) {
  const r = await fetch("/api" + path);
  if (!r.ok) throw new Error("API error " + r.status);
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error("Invalid JSON from API"); }
}
async function localPost(path, body) {
  const r = await fetch("/api" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const api = {
  // Projects
  projects: () => localGet("/projects"),
  summary: () => localGet("/summary"),
  project: (id) => localGet("/projects").then(list => list.find(p => p.id === Number(id)) || null),
  projectData: (id) => localGet("/project-data?project_id=" + id).catch(() => []),
  deleteProject: async () => { },

  // Incidents
  incidents: () => localGet("/incidents"),

  // GitHub
  github: (repo) => localGet("/github?repo=" + encodeURIComponent(repo)).catch(() => ({ full_name: repo, language: null, default_branch: "main", homepage: null, html_url: "https://github.com/" + repo })),
  commits: (repo) => localGet("/github?repo=" + encodeURIComponent(repo || "") + "&action=commits").catch(() => []),
  contents: (repo, path) => localGet("/github?repo=" + encodeURIComponent(repo || "") + "&action=contents&path=" + encodeURIComponent(path || "")).catch(() => ({ type: "file", content: "" })),
  proposeChange: async () => ({ message: "Feature not available in demo mode" }),

  // AI Chat — serverless function calling Groq
  chat: async (messages, projectId) => {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, project_id: projectId })
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  chatHistory: async () => [],
  clearChat: async () => { },

  // Services & Deployments
  services: (id) => localGet("/services?project_id=" + id),
  deployments: (id) => localGet("/deployments?project_id=" + id),

  // Analytics
  recordView: async () => { try { await localPost('/analytics', { action: 'record' }); } catch {} },
  analytics: () => localGet('/analytics'),

  // Feedback & Contact
  feedback: async (data) => { return localPost('/feedback', data); },
  listFeedback: () => localGet('/feedback'),
  contact: async (data) => { return localPost('/contacts', data); },
  listContacts: () => localGet('/contacts'),

  // Profile
  profile: async () => {
    try { return await localGet("/profile"); } catch { return FALLBACK_PROFILE; }
  },

  // Sync & Investigation
  sync: async () => ({ added: 0, skipped: 0, repos_found: 0 }),
  investigate: async () => ({ message: "Feature not available without backend" })
};
