// Vercel serverless function: GET /api/projects
// Returns all registered projects with their data

const PROJECTS = [
  { id: 1, name: "Demo Production API", repo: "demo/reliability-api", status: "Healthy", uptime: 99.96, language: "Python" },
  { id: 2, name: "Anshul Rawat Portfolio", repo: "Anshul1023/anshul-rawat-portfolio", status: "Healthy", uptime: 99.99, language: "TypeScript", description: "Personal portfolio built with React, TypeScript, Vite, Tailwind CSS" },
  { id: 3, name: "ai-reliability-platform", repo: "Anshul1023/ai-reliability-platform", status: "Healthy", uptime: 99.99, language: "Python", description: "Dockerized observability stack: FastAPI + React + Redis" },
  { id: 4, name: "interview-agent", repo: "Anshul1023/interview-agent", status: "Healthy", uptime: 99.99, language: "JavaScript", description: "Real-time AI interview assistant with hidden overlay" },
  { id: 5, name: "AgentFlow-Ai", repo: "Anshul1023/AgentFlow-Ai", status: "Healthy", uptime: 99.99, language: "Python", description: "Multi-agent business problem-solving system" },
  { id: 6, name: "adaptive_ai_engine", repo: "Anshul1023/adaptive_ai_engine", status: "Healthy", uptime: 99.99, language: "JavaScript", description: "AI Content Engine with FastAPI + React" },
  { id: 7, name: "school-management", repo: "Anshul1023/school-management", status: "Healthy", uptime: 99.99, language: "JavaScript", description: "Full-stack MERN app for student/task management" },
  { id: 8, name: "contact-backend", repo: "Anshul1023/contact-backend", status: "Healthy", uptime: 99.99, language: "Python", description: "FastAPI backend for portfolio contact form" },
  { id: 9, name: "Anshul1023", repo: "Anshul1023/Anshul1023", status: "Healthy", uptime: 99.99, language: "Python", description: "GitHub profile README" },
  { id: 10, name: "browser-camera", repo: "Anshul1023/browser-camera", status: "Healthy", uptime: 99.99, language: "JavaScript", description: "Lightweight browser camera app" },
  { id: 11, name: "workflow-builder", repo: "Anshul1023/workflow-builder", status: "Healthy", uptime: 99.99, language: "TypeScript", description: "Visual workflow builder with React Flow" },
  { id: 12, name: "crafty-canvas", repo: "Anshul1023/crafty-canvas", status: "Healthy", uptime: 99.99, language: "TypeScript", description: "Expense tracking app with React + Supabase" },
  { id: 13, name: "Fastapi", repo: "Anshul1023/Fastapi", status: "Healthy", uptime: 99.99, language: "Python", description: "FastAPI + SQLAlchemy async backend starter" },
  { id: 14, name: "audiodownloader", repo: "Anshul1023/audiodownloader", status: "Healthy", uptime: 99.99, language: "TypeScript", description: "Full-stack media downloader with FastAPI + FFmpeg" },
  { id: 15, name: "usage-billing-system", repo: "Anshul1023/usage-billing-system", status: "Healthy", uptime: 99.99, language: "TypeScript", description: "Usage and billing platform with FastAPI + WebSockets" },
  { id: 16, name: "resume_analyzer", repo: "Anshul1023/resume_analyzer", status: "Healthy", uptime: 99.99, language: "Python", description: "AI resume analyzer with Streamlit + Ollama + Llama 3" },
  { id: 17, name: "JavaScript-Snake-game", repo: "Anshul1023/JavaScript-Snake-game", status: "Healthy", uptime: 99.99, language: "JavaScript", description: "Classic snake game with JavaScript" },
  { id: 19, name: "Hello World", repo: "octocat/Hello-World", status: "Healthy", uptime: 99.99, language: null, description: "First repository on GitHub" }
];

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.status(200).json(PROJECTS);
};
