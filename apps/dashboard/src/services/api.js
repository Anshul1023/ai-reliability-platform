// API service — all calls go to Vercel serverless functions (/api/*)
// With comprehensive fallbacks for local development

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
  links: { github: "https://github.com/Anshul1023", linkedin: "https://www.linkedin.com/in/anshul-rawat-235019290", portfolio: "https://anshul-rawat-portfolio.vercel.app" },
  skills: ["React.js", "JavaScript (ES6+)", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "Vite", "Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
  experience: [
    { role: "Full Stack Developer", company: "Odds Fitness", period: "2025 — Present", points: ["Built production React + FastAPI features used by real users", "Implemented AI-powered content generation using RAG, vector search, and LLM agents", "Set up Docker, Redis caching, and Prometheus + Grafana monitoring", "Designed RESTful APIs with PostgreSQL, async Python, and WebSockets"] },
    { role: "Frontend Developer", company: "SGS Onsite Solutions", period: "2024 — 2025", points: ["Developed responsive dashboards and client-facing web apps using React + TypeScript", "Integrated third-party APIs with Redux and Context API state management", "Improved performance by 40% through code splitting and lazy loading"] },
    { role: "Web Development Intern", company: "Interpe Inc", period: "2023 — 2024", points: ["Built landing pages using HTML, CSS, JavaScript, and React", "Learned Git workflows, code reviews, and agile sprint methodology"] }
  ],
  projects: [],
  education: [{ degree: "Bachelor of Technology in Computer Science", school: "Manav Rachna University, Faridabad", period: "2021 — 2025" }],
  languages: ["Hindi", "English"]
};

const FALLBACK_PROJECTS = [
  {id:1,name:"Demo Production API",repo:"demo/reliability-api",status:"Healthy",uptime:99.96,language:"Python",description:"Demo API for testing reliability monitoring"},
  {id:2,name:"Anshul Rawat Portfolio",repo:"Anshul1023/anshul-rawat-portfolio",status:"Healthy",uptime:99.99,language:"TypeScript",description:"Personal portfolio built with React, TypeScript, Vite, Tailwind CSS"},
  {id:3,name:"ai-reliability-platform",repo:"Anshul1023/ai-reliability-platform",status:"Healthy",uptime:99.99,language:"Python",description:"Dockerized observability stack: FastAPI + React + Redis + PostgreSQL"},
  {id:4,name:"interview-agent",repo:"Anshul1023/interview-agent",status:"Healthy",uptime:99.99,language:"JavaScript",description:"Real-time AI interview assistant with hidden overlay"},
  {id:5,name:"AgentFlow-Ai",repo:"Anshul1023/AgentFlow-Ai",status:"Healthy",uptime:99.99,language:"Python",description:"Multi-agent business problem-solving system"},
  {id:6,name:"adaptive_ai_engine",repo:"Anshul1023/adaptive_ai_engine",status:"Healthy",uptime:99.99,language:"JavaScript",description:"AI Content Engine with FastAPI + React"},
  {id:7,name:"school-management",repo:"Anshul1023/school-management",status:"Healthy",uptime:99.99,language:"JavaScript",description:"Full-stack MERN app for student/task management"},
  {id:8,name:"contact-backend",repo:"Anshul1023/contact-backend",status:"Healthy",uptime:99.99,language:"Python",description:"FastAPI backend for portfolio contact form"},
  {id:9,name:"Anshul1023",repo:"Anshul1023/Anshul1023",status:"Healthy",uptime:99.99,language:"Python",description:"GitHub profile README"},
  {id:10,name:"browser-camera",repo:"Anshul1023/browser-camera",status:"Healthy",uptime:99.99,language:"JavaScript",description:"Lightweight browser camera app"},
  {id:11,name:"workflow-builder",repo:"Anshul1023/workflow-builder",status:"Healthy",uptime:99.99,language:"TypeScript",description:"Visual workflow builder with React Flow"},
  {id:12,name:"crafty-canvas",repo:"Anshul1023/crafty-canvas",status:"Healthy",uptime:99.99,language:"TypeScript",description:"Expense tracking app with React + Supabase"},
  {id:13,name:"Fastapi",repo:"Anshul1023/Fastapi",status:"Healthy",uptime:99.99,language:"Python",description:"FastAPI + SQLAlchemy async backend starter"},
  {id:14,name:"audiodownloader",repo:"Anshul1023/audiodownloader",status:"Healthy",uptime:99.99,language:"TypeScript",description:"Full-stack media downloader with FastAPI + FFmpeg"},
  {id:15,name:"usage-billing-system",repo:"Anshul1023/usage-billing-system",status:"Healthy",uptime:99.99,language:"TypeScript",description:"Usage and billing platform with FastAPI + WebSockets"},
  {id:16,name:"resume_analyzer",repo:"Anshul1023/resume_analyzer",status:"Healthy",uptime:99.99,language:"Python",description:"AI resume analyzer with Streamlit + Ollama + Llama 3"},
  {id:17,name:"JavaScript-Snake-game",repo:"Anshul1023/JavaScript-Snake-game",status:"Healthy",uptime:99.99,language:"JavaScript",description:"Classic snake game with JavaScript"},
  {id:19,name:"Hello World",repo:"octocat/Hello-World",status:"Healthy",uptime:99.99,language:null,description:"First repository on GitHub"}
];

const FALLBACK_SUMMARY = {services:{1:5,2:2},deployments:{1:2},incidents:{1:1},totalServices:7,totalDeployments:2,totalIncidents:1,uptime:99.99};
const FALLBACK_INCIDENTS = [{id:1,project_id:1,title:"Payment API latency spike",service:"Payments API",severity:"Critical",status:"Investigating",created_at:"2026-08-10T05:35:43Z",resolved_at:null}];
const FALLBACK_ANALYTICS = {total_views:191,unique_visitors:42,daily:[{date:"2026-08-14",views:12,visitors:5},{date:"2026-08-15",views:18,visitors:8},{date:"2026-08-16",views:25,visitors:11},{date:"2026-08-17",views:31,visitors:14},{date:"2026-08-18",views:22,visitors:9},{date:"2026-08-19",views:45,visitors:20},{date:"2026-08-20",views:38,visitors:17}],per_project:[{id:3,name:"ai-reliability-platform",views:52},{id:2,name:"anshul-rawat-portfolio",views:38},{id:4,name:"interview-agent",views:28}],per_path:[{path:"/overview",views:45},{path:"/projects",views:38},{path:"/about",views:32}]};
const FALLBACK_FEEDBACK = [{id:1,name:"Priya Sharma",message:"Love the AI chat feature!",rating:5,created_at:"2026-08-18T10:30:00Z"},{id:2,name:"Rahul Verma",message:"Great portfolio, impressive animations.",rating:4,created_at:"2026-08-19T14:20:00Z"}];
const FALLBACK_CONTACTS = [{id:1,name:"Vikram Singh",topic:"Freelance project",email:"vikram@example.com",message:"Hi, I saw your dashboard and want to discuss a project.",created_at:"2026-08-17T11:00:00Z"}];

export function getApiKey() { return localStorage.getItem(KEY_STORE) || "" }
export function setApiKey(k) { k ? localStorage.setItem(KEY_STORE, k) : localStorage.removeItem(KEY_STORE) }
export function isOwner() { return !!(getApiKey() || localStorage.getItem("pulseops_owner_email") || localStorage.getItem("pulseops_jwt")) }

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
  if (!r.ok) throw new Error("API error " + r.status);
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error("Invalid JSON from API"); }
}

export const api = {
  projects: () => localGet("/projects").catch(() => FALLBACK_PROJECTS),
  summary: () => localGet("/summary").catch(() => FALLBACK_SUMMARY),
  project: (id) => localGet("/projects").then(list => list.find(p => p.id === Number(id)) || null).catch(() => FALLBACK_PROJECTS.find(p => p.id === Number(id)) || null),
  projectData: (id) => localGet("/project-data?project_id=" + id).catch(() => []),
  deleteProject: async () => { },
  incidents: () => localGet("/incidents").catch(() => FALLBACK_INCIDENTS),
  github: (repo) => localGet("/github?repo=" + encodeURIComponent(repo)).catch(() => ({ full_name: repo, language: null, default_branch: "main", homepage: null, html_url: "https://github.com/" + repo })),
  commits: (repo) => localGet("/github?repo=" + encodeURIComponent(repo || "") + "&action=commits").catch(() => []),
  contents: (repo, path) => localGet("/github?repo=" + encodeURIComponent(repo || "") + "&action=contents&path=" + encodeURIComponent(path || "")).catch(() => ({ type: "file", content: "" })),
  proposeChange: async () => ({ message: "Feature not available in demo mode" }),
  chat: async (messages, projectId) => {
    const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, project_id: projectId }) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  chatHistory: async () => [],
  clearChat: async () => { },
  services: (id) => localGet("/services?project_id=" + id).catch(() => id===1?[{id:1,name:"API Gateway",status:"Healthy",latency_ms:220,uptime:99.9},{id:2,name:"Payments API",status:"Healthy",latency_ms:245,uptime:99.9},{id:3,name:"AI Worker",status:"Degraded",latency_ms:612,uptime:99.9},{id:4,name:"PostgreSQL",status:"Healthy",latency_ms:32,uptime:99.9},{id:5,name:"Redis",status:"Healthy",latency_ms:4,uptime:99.9}]:id===2?[{id:6,name:"Vercel",status:"Healthy",latency_ms:262,uptime:99.99}]:[]),
  deployments: (id) => localGet("/deployments?project_id=" + id).catch(() => id===1?[{id:1,project_id:1,sha:"a1b2c3d",message:"Fix payment gateway timeout",author:"Anshul",status:"success",created_at:"2026-08-09T14:30:00Z"}]:[]),
  recordView: async () => {},
  analytics: () => localGet("/analytics").catch(() => FALLBACK_ANALYTICS),
  feedback: async (data) => { try { return await localPost("/feedback", data); } catch { return {ok:true}; } },
  listFeedback: () => localGet("/feedback").catch(() => FALLBACK_FEEDBACK),
  contact: async (data) => { try { return await localPost("/contacts", data); } catch { return {ok:true}; } },
  listContacts: () => localGet("/contacts").catch(() => FALLBACK_CONTACTS),
  profile: async () => { try { return await localGet("/profile"); } catch { return FALLBACK_PROFILE; } },
  sync: async () => ({ added: 0, skipped: 0, repos_found: 0 }),
  investigate: async () => ({ message: "Feature not available without backend" })
};
