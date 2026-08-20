// Vercel serverless function: GET /api/project-data?project_id=3
const PROJECT_DOCS = {
  3: [
    { data_type: "repository", payload: { full_name: "Anshul1023/ai-reliability-platform", language: "Python", default_branch: "main", description: "Dockerized observability stack: FastAPI + React + Redis + PostgreSQL", homepage: "https://ai-reliability-platform.vercel.app" } },
    { data_type: "files", payload: ["apps/api/main.py", "apps/api/routes/projects.py", "apps/api/services/github.py", "apps/dashboard/src/App.jsx", "apps/dashboard/src/main.jsx", "apps/dashboard/src/styles.css", "docker-compose.yml", "render.yaml", "README.md", "requirements.txt", "apps/django-logic/logic/settings.py", "apps/django-logic/logic/urls.py"] },
    { data_type: "services", payload: [{ name: "FastAPI", status: "Healthy" }, { name: "React Dashboard", status: "Healthy" }, { name: "Redis", status: "Healthy" }, { name: "PostgreSQL", status: "Healthy" }] },
  ],
  2: [
    { data_type: "repository", payload: { full_name: "Anshul1023/anshul-rawat-portfolio", language: "TypeScript", default_branch: "Ansh", description: "Personal portfolio built with React, TypeScript, Vite, Tailwind CSS", homepage: "https://anshul-rawat-portfolio.vercel.app" } },
    { data_type: "files", payload: ["frontend/src/App.tsx", "frontend/src/main.tsx", "frontend/src/index.css", "frontend/src/components/sections/HeroSection.tsx", "frontend/src/components/sections/ProjectsSection.tsx", "frontend/src/components/sections/SkillsSection.tsx", "frontend/src/data/portfolio.ts", "frontend/vite.config.ts", "frontend/tailwind.config.js", "backend/src/index.js", "backend/src/routes/contact.js", "README.md", "package.json"] },
    { data_type: "services", payload: [{ name: "Vercel", status: "Healthy" }, { name: "Backend", status: "Healthy" }] },
  ],
  1: [
    { data_type: "repository", payload: { full_name: "demo/reliability-api", language: "Python", default_branch: "main", description: "Demo API for testing reliability monitoring" } },
    { data_type: "files", payload: ["src/main.py", "src/routes/health.py", "src/services/monitor.py", "Dockerfile", "docker-compose.yml", "requirements.txt", "README.md"] },
    { data_type: "services", payload: [{ name: "API Gateway", status: "Healthy" }, { name: "Payments API", status: "Healthy" }, { name: "AI Worker", status: "Degraded" }, { name: "PostgreSQL", status: "Healthy" }, { name: "Redis", status: "Healthy" }] },
  ],
};

// Generate generic file trees for projects without specific data
function genericDocs(id, repo, lang) {
  const ext = lang === "Python" ? ".py" : lang === "TypeScript" ? ".ts" : ".js";
  const folder = lang === "Python" ? "src" : "src";
  return [
    { data_type: "repository", payload: { full_name: repo, language: lang, default_branch: "main", description: "" } },
    { data_type: "files", payload: [`${folder}/main${ext}`, `${folder}/index${ext}`, `${folder}/app${ext}`, "package.json", "README.md", ".gitignore"] },
  ];
}

const PROJECT_META = {
  4: { lang: "JavaScript", name: "interview-agent" },
  5: { lang: "Python", name: "AgentFlow-Ai" },
  6: { lang: "JavaScript", name: "adaptive_ai_engine" },
  7: { lang: "JavaScript", name: "school-management" },
  8: { lang: "Python", name: "contact-backend" },
  9: { lang: "Python", name: "Anshul1023" },
  10: { lang: "JavaScript", name: "browser-camera" },
  11: { lang: "TypeScript", name: "workflow-builder" },
  12: { lang: "TypeScript", name: "crafty-canvas" },
  13: { lang: "Python", name: "Fastapi" },
  14: { lang: "TypeScript", name: "audiodownloader" },
  15: { lang: "TypeScript", name: "usage-billing-system" },
  16: { lang: "Python", name: "resume_analyzer" },
  17: { lang: "JavaScript", name: "JavaScript-Snake-game" },
  19: { lang: null, name: "Hello-World" },
};

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const pid = Number(req.query.project_id || req.query.projectId);
  if (!pid) return res.status(200).json([]);

  let docs = PROJECT_DOCS[pid];
  if (!docs) {
    const meta = PROJECT_META[pid];
    if (meta) {
      docs = genericDocs(pid, `Anshul1023/${meta.name}`, meta.lang);
    } else {
      docs = [];
    }
  }
  return res.status(200).json(docs);
};
