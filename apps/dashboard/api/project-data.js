// Vercel serverless function: GET /api/project-data?project_id=N
// Returns repository info, file tree, and services for each project

const PROJECTS = {
  1: {
    repo: { full_name: "demo/reliability-api", language: "Python", default_branch: "main", description: "Demo API for testing reliability monitoring", homepage: null },
    files: ["src/main.py", "src/routes/health.py", "src/routes/projects.py", "src/services/monitor.py", "src/services/notify.py", "Dockerfile", "docker-compose.yml", "requirements.txt", "README.md"],
    services: [{ name: "API Gateway", status: "Healthy" }, { name: "Payments API", status: "Healthy" }, { name: "AI Worker", status: "Degraded" }, { name: "PostgreSQL", status: "Healthy" }, { name: "Redis", status: "Healthy" }],
  },
  2: {
    repo: { full_name: "Anshul1023/anshul-rawat-portfolio", language: "TypeScript", default_branch: "Ansh", description: "Personal portfolio built with React, TypeScript, Vite, Tailwind CSS", homepage: "https://anshul-rawat-portfolio.vercel.app" },
    files: ["frontend/src/App.tsx", "frontend/src/main.tsx", "frontend/src/index.css", "frontend/src/components/sections/HeroSection.tsx", "frontend/src/components/sections/ProjectsSection.tsx", "frontend/src/components/sections/SkillsSection.tsx", "frontend/src/components/sections/AboutSection.tsx", "frontend/src/data/portfolio.ts", "frontend/vite.config.ts", "frontend/tailwind.config.js", "backend/src/index.js", "backend/src/routes/contact.js", "backend/src/utils/emailer.js", "README.md", "package.json"],
    services: [{ name: "Vercel", status: "Healthy" }, { name: "Railway Backend", status: "Healthy" }],
  },
  3: {
    repo: { full_name: "Anshul1023/ai-reliability-platform", language: "Python", default_branch: "main", description: "Dockerized observability stack: FastAPI + React + Redis + PostgreSQL", homepage: "https://ai-reliability-platform.vercel.app" },
    files: ["apps/api/main.py", "apps/api/app/ai/chat.py", "apps/api/app/ai/agent.py", "apps/api/app/api/websocket.py", "apps/api/app/auth/jwt.py", "apps/api/app/core/config.py", "apps/api/app/services/github_service.py", "apps/api/app/services/monitoring_service.py", "apps/dashboard/src/main.jsx", "apps/dashboard/src/styles.css", "apps/dashboard/api/chat.js", "apps/django-logic/core/views.py", "apps/django-logic/core/models.py", "docker-compose.yml", "requirements.txt", "README.md"],
    services: [{ name: "FastAPI", status: "Healthy" }, { name: "React Dashboard", status: "Healthy" }, { name: "Redis", status: "Healthy" }, { name: "PostgreSQL", status: "Healthy" }],
  },
  4: {
    repo: { full_name: "Anshul1023/interview-agent", language: "JavaScript", default_branch: "main", description: "Real-time AI interview assistant with hidden overlay", homepage: null },
    files: ["backend/main.py", "backend/groq_client.py", "backend/audio_listener.py", "frontend/src/App.jsx", "frontend/src/components/Overlay.jsx", "frontend/src/components/Controls.jsx", "frontend/vite.config.js", "package.json", "README.md"],
    services: [{ name: "FastAPI Backend", status: "Healthy" }, { name: "WebSocket Server", status: "Healthy" }],
  },
  5: {
    repo: { full_name: "Anshul1023/AgentFlow-Ai", language: "Python", default_branch: "main", description: "Multi-agent business problem-solving system", homepage: null },
    files: ["agentflow/main.py", "agentflow/agents/planner.py", "agentflow/agents/researcher.py", "agentflow/agents/coder.py", "agentflow/workflow.py", "requirements.txt", "README.md"],
    services: [{ name: "FastAPI", status: "Healthy" }],
  },
  6: {
    repo: { full_name: "Anshul1023/adaptive_ai_engine", language: "JavaScript", default_branch: "main", description: "AI Content Engine with FastAPI + React", homepage: null },
    files: ["backend/main.py", "backend/engine/content_engine.py", "backend/engine/templates.py", "frontend/src/App.jsx", "frontend/src/components/Editor.jsx", "frontend/src/components/Preview.jsx", "vite.config.js", "package.json", "README.md"],
    services: [{ name: "FastAPI", status: "Healthy" }, { name: "React Frontend", status: "Healthy" }],
  },
  7: {
    repo: { full_name: "Anshul1023/school-management", language: "JavaScript", default_branch: "main", description: "Full-stack MERN app for student/task management", homepage: null },
    files: ["backend/server.js", "backend/routes/students.js", "backend/routes/auth.js", "backend/models/Student.js", "backend/models/User.js", "frontend/src/App.jsx", "frontend/src/pages/Dashboard.jsx", "frontend/src/pages/Students.jsx", "frontend/src/components/Navbar.jsx", "package.json", "README.md"],
    services: [{ name: "Express API", status: "Healthy" }, { name: "MongoDB", status: "Healthy" }],
  },
  8: {
    repo: { full_name: "Anshul1023/contact-backend", language: "Python", default_branch: "main", description: "FastAPI backend for portfolio contact form", homepage: null },
    files: ["main.py", "models.py", "schemas.py", "emailer.py", "database.py", "requirements.txt", "README.md"],
    services: [{ name: "FastAPI", status: "Healthy" }],
  },
  9: {
    repo: { full_name: "Anshul1023/Anshul1023", language: "Python", default_branch: "main", description: "GitHub profile README with developer summary", homepage: null },
    files: ["README.md", ".github/profile/README.md"],
    services: [],
  },
  10: {
    repo: { full_name: "Anshul1023/browser-camera", language: "JavaScript", default_branch: "main", description: "Lightweight browser camera app", homepage: null },
    files: ["src/App.jsx", "src/components/Camera.jsx", "src/components/Controls.jsx", "src/hooks/useCamera.js", "index.html", "vite.config.js", "package.json", "README.md"],
    services: [{ name: "Vercel", status: "Healthy" }],
  },
  11: {
    repo: { full_name: "Anshul1023/workflow-builder", language: "TypeScript", default_branch: "main", description: "Visual workflow builder with React Flow", homepage: null },
    files: ["src/App.tsx", "src/components/Canvas.tsx", "src/components/NodePalette.tsx", "src/components/PropertiesPanel.tsx", "src/utils/validator.ts", "src/types/workflow.ts", "vite.config.ts", "tailwind.config.js", "package.json", "README.md"],
    services: [{ name: "Vercel", status: "Healthy" }],
  },
  12: {
    repo: { full_name: "Anshul1023/crafty-canvas", language: "TypeScript", default_branch: "main", description: "Expense tracking app with React + Supabase", homepage: null },
    files: ["src/App.tsx", "src/pages/Dashboard.tsx", "src/pages/Expenses.tsx", "src/components/ExpenseForm.tsx", "src/components/Chart.tsx", "src/lib/supabase.ts", "vite.config.ts", "tailwind.config.js", "package.json", "README.md"],
    services: [{ name: "Vercel", status: "Healthy" }, { name: "Supabase", status: "Healthy" }],
  },
  13: {
    repo: { full_name: "Anshul1023/Fastapi", language: "Python", default_branch: "main", description: "FastAPI + SQLAlchemy async backend starter", homepage: null },
    files: ["app/main.py", "app/models.py", "app/schemas.py", "app/database.py", "app/routes/items.py", "app/routes/health.py", "Dockerfile", "docker-compose.yml", "requirements.txt", "README.md"],
    services: [{ name: "FastAPI", status: "Healthy" }, { name: "PostgreSQL", status: "Healthy" }],
  },
  14: {
    repo: { full_name: "Anshul1023/audiodownloader", language: "TypeScript", default_branch: "main", description: "Full-stack media downloader with FastAPI + FFmpeg", homepage: null },
    files: ["backend/main.py", "backend/downloader.py", "backend/converter.py", "frontend/src/App.jsx", "frontend/src/components/DownloadForm.jsx", "frontend/src/components/Progress.jsx", "vite.config.js", "package.json", "README.md"],
    services: [{ name: "FastAPI", status: "Healthy" }, { name: "FFmpeg Worker", status: "Healthy" }],
  },
  15: {
    repo: { full_name: "Anshul1023/usage-billing-system", language: "TypeScript", default_branch: "main", description: "Usage and billing platform with FastAPI + WebSockets", homepage: null },
    files: ["backend/main.py", "backend/models.py", "backend/billing/engine.py", "backend/billing/usage_tracker.py", "frontend/src/App.tsx", "frontend/src/pages/Billing.tsx", "frontend/src/pages/Usage.tsx", "vite.config.ts", "package.json", "README.md"],
    services: [{ name: "FastAPI", status: "Healthy" }, { name: "WebSocket", status: "Healthy" }, { name: "PostgreSQL", status: "Healthy" }],
  },
  16: {
    repo: { full_name: "Anshul1023/resume_analyzer", language: "Python", default_branch: "main", description: "AI resume analyzer with Streamlit + Ollama + Llama 3", homepage: null },
    files: ["app.py", "analyzer.py", "utils/pdf_reader.py", "utils/ollama_client.py", "prompts/system_prompt.txt", "requirements.txt", "README.md"],
    services: [{ name: "Streamlit", status: "Healthy" }],
  },
  17: {
    repo: { full_name: "Anshul1023/JavaScript-Snake-game", language: "JavaScript", default_branch: "main", description: "Classic snake game with JavaScript", homepage: null },
    files: ["index.html", "game.js", "snake.js", "food.js", "style.css", "README.md"],
    services: [],
  },
  19: {
    repo: { full_name: "octocat/Hello-World", language: null, default_branch: "main", description: "First repository on GitHub", homepage: null },
    files: ["README.md"],
    services: [],
  },
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const pid = Number(req.query.project_id || req.query.projectId);
  if (!pid) return res.status(200).json([]);

  const p = PROJECTS[pid];
  if (!p) return res.status(200).json([]);

  return res.status(200).json([
    { data_type: "repository", payload: p.repo },
    { data_type: "files", payload: p.files },
    ...(p.services.length ? [{ data_type: "services", payload: p.services }] : []),
  ]);
}
