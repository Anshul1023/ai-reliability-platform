// Vercel serverless function: combined GitHub data endpoint
// GET /api/github?repo=owner/name — repo metadata
// GET /api/github?repo=owner/name&action=commits — recent commits
// GET /api/github?repo=owner/name&action=contents&path=src/main.py — file content

const REPOS = {
  "Anshul1023/ai-reliability-platform": { full_name: "Anshul1023/ai-reliability-platform", language: "Python", default_branch: "main", description: "Dockerized observability stack: FastAPI + React + Redis + PostgreSQL", homepage: "https://ai-reliability-platform.vercel.app", html_url: "https://github.com/Anshul1023/ai-reliability-platform" },
  "Anshul1023/anshul-rawat-portfolio": { full_name: "Anshul1023/anshul-rawat-portfolio", language: "TypeScript", default_branch: "Ansh", description: "Personal portfolio built with React, TypeScript, Vite, Tailwind CSS", homepage: "https://anshul-rawat-portfolio.vercel.app", html_url: "https://github.com/Anshul1023/anshul-rawat-portfolio" },
  "demo/reliability-api": { full_name: "demo/reliability-api", language: "Python", default_branch: "main", description: "Demo API for testing reliability monitoring", homepage: null, html_url: "https://github.com/demo/reliability-api" },
  "Anshul1023/interview-agent": { full_name: "Anshul1023/interview-agent", language: "JavaScript", default_branch: "main", description: "Real-time AI interview assistant with hidden overlay", homepage: null, html_url: "https://github.com/Anshul1023/interview-agent" },
  "Anshul1023/AgentFlow-Ai": { full_name: "Anshul1023/AgentFlow-Ai", language: "Python", default_branch: "main", description: "Multi-agent business problem-solving system", homepage: null, html_url: "https://github.com/Anshul1023/AgentFlow-Ai" },
  "Anshul1023/adaptive_ai_engine": { full_name: "Anshul1023/adaptive_ai_engine", language: "JavaScript", default_branch: "main", description: "AI Content Engine with FastAPI + React", homepage: null, html_url: "https://github.com/Anshul1023/adaptive_ai_engine" },
  "Anshul1023/school-management": { full_name: "Anshul1023/school-management", language: "JavaScript", default_branch: "main", description: "Full-stack MERN app for student/task management", homepage: null, html_url: "https://github.com/Anshul1023/school-management" },
  "Anshul1023/contact-backend": { full_name: "Anshul1023/contact-backend", language: "Python", default_branch: "main", description: "FastAPI backend for portfolio contact form", homepage: null, html_url: "https://github.com/Anshul1023/contact-backend" },
  "Anshul1023/Anshul1023": { full_name: "Anshul1023/Anshul1023", language: "Python", default_branch: "main", description: "GitHub profile README", homepage: null, html_url: "https://github.com/Anshul1023/Anshul1023" },
  "Anshul1023/browser-camera": { full_name: "Anshul1023/browser-camera", language: "JavaScript", default_branch: "main", description: "Lightweight browser camera app", homepage: null, html_url: "https://github.com/Anshul1023/browser-camera" },
  "Anshul1023/workflow-builder": { full_name: "Anshul1023/workflow-builder", language: "TypeScript", default_branch: "main", description: "Visual workflow builder with React Flow", homepage: null, html_url: "https://github.com/Anshul1023/workflow-builder" },
  "Anshul1023/crafty-canvas": { full_name: "Anshul1023/crafty-canvas", language: "TypeScript", default_branch: "main", description: "Expense tracking app with React + Supabase", homepage: null, html_url: "https://github.com/Anshul1023/crafty-canvas" },
  "Anshul1023/Fastapi": { full_name: "Anshul1023/Fastapi", language: "Python", default_branch: "main", description: "FastAPI + SQLAlchemy async backend starter", homepage: null, html_url: "https://github.com/Anshul1023/Fastapi" },
  "Anshul1023/audiodownloader": { full_name: "Anshul1023/audiodownloader", language: "TypeScript", default_branch: "main", description: "Full-stack media downloader with FastAPI + FFmpeg", homepage: null, html_url: "https://github.com/Anshul1023/audiodownloader" },
  "Anshul1023/usage-billing-system": { full_name: "Anshul1023/usage-billing-system", language: "TypeScript", default_branch: "main", description: "Usage and billing platform with FastAPI + WebSockets", homepage: null, html_url: "https://github.com/Anshul1023/usage-billing-system" },
  "Anshul1023/resume_analyzer": { full_name: "Anshul1023/resume_analyzer", language: "Python", default_branch: "main", description: "AI resume analyzer with Streamlit + Ollama + Llama 3", homepage: null, html_url: "https://github.com/Anshul1023/resume_analyzer" },
  "Anshul1023/JavaScript-Snake-game": { full_name: "Anshul1023/JavaScript-Snake-game", language: "JavaScript", default_branch: "main", description: "Classic snake game", homepage: null, html_url: "https://github.com/Anshul1023/JavaScript-Snake-game" },
  "octocat/Hello-World": { full_name: "octocat/Hello-World", language: null, default_branch: "main", description: "First repository on GitHub", homepage: null, html_url: "https://github.com/octocat/Hello-World" },
};

const COMMITS = [
  { sha: "a1b2c3d4e5f6", message: "fix: convert serverless functions from CommonJS to ESM", author: "Anshul", status: "success", created_at: "2026-08-20T10:00:00Z" },
  { sha: "b2c3d4e5f6a7", message: "feat: add analytics, feedback, and contacts endpoints", author: "Anshul", status: "success", created_at: "2026-08-19T16:30:00Z" },
  { sha: "c3d4e5f6a7b8", message: "fix: AI chat context trimming for Groq free tier", author: "Anshul", status: "success", created_at: "2026-08-18T14:15:00Z" },
  { sha: "d4e5f6a7b8c9", message: "feat: premium dark theme overhaul", author: "Anshul", status: "success", created_at: "2026-08-17T11:00:00Z" },
  { sha: "e5f6a7b8c9d0", message: "feat: add Vercel serverless functions for all API endpoints", author: "Anshul", status: "success", created_at: "2026-08-16T09:45:00Z" },
  { sha: "f6a7b8c9d0e1", message: "fix: remove login gate — dashboard is public by default", author: "Anshul", status: "success", created_at: "2026-08-15T15:20:00Z" },
  { sha: "a7b8c9d0e1f2", message: "feat: Add Pydantic JWT auth for admin", author: "Anshul", status: "success", created_at: "2026-08-14T12:10:00Z" },
  { sha: "b8c9d0e1f2a3", message: "feat: Django business logic layer for project management", author: "Anshul", status: "success", created_at: "2026-08-13T10:30:00Z" },
];

const FILE_CONTENTS = {
  "apps/api/main.py": "# FastAPI main entry point\nfrom fastapi import FastAPI\napp = FastAPI(title='AI Reliability Platform')\n\n@app.get('/health')\ndef health():\n    return {'status': 'ok'}",
  "apps/dashboard/src/main.jsx": "// PulseOps Dashboard — React + Vite\nimport React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\ncreateRoot(document.getElementById('root')).render(<App />)",
  "docker-compose.yml": "version: '3.8'\nservices:\n  api:\n    build: ./apps/api\n    ports: ['8000:8000']\n  redis:\n    image: redis:7\n  postgres:\n    image: postgres:16",
  "requirements.txt": "fastapi==0.115.0\nuvicorn==0.34.0\nsqlalchemy==2.0.36\npydantic==2.10.0\nredis==5.0.0",
  "README.md": "# AI Reliability Platform\nDockerized observability stack: FastAPI + React + Redis + PostgreSQL\nwith real HTTP health monitoring and AI incident investigation.",
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const repo = req.query.repo || "";
  const action = req.query.action || "";

  // GET /api/github?repo=...&action=commits
  if (action === "commits") {
    return res.status(200).json(COMMITS);
  }

  // GET /api/github?repo=...&action=contents&path=...
  if (action === "contents") {
    const filePath = req.query.path || "";
    const content = FILE_CONTENTS[filePath] || `// File: ${filePath}\n// Content preview not available in demo mode.`;
    return res.status(200).json({ type: "file", content: Buffer.from(content).toString("base64") });
  }

  // GET /api/github?repo=... — repo metadata
  const data = REPOS[repo];
  if (!data) return res.status(404).json({ error: "Repository not found" });
  return res.status(200).json(data);
}
