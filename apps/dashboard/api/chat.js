// Vercel serverless function: POST /api/chat
// Calls Groq LLM with project context

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.AI_MODEL || "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You are Dev — a highly experienced senior developer and AI assistant for Anshul Rawat's projects. You know all his repos, tech stacks, and architecture decisions. You talk like a trusted peer: warm, direct, practical. Always try to be genuinely useful.

Anshul's projects:
- Portfolio (React/TypeScript/Vite/Tailwind) — anshulrawat-portfolio.vercel.app
- AI Reliability Platform (FastAPI/React/Redis/PostgreSQL/Docker) — monitoring + incident management
- AgentFlow-Ai (FastAPI/Python) — multi-agent business problem solver
- Adaptive AI Engine (FastAPI/React/Python) — AI content engine
- Interview Agent (FastAPI/Groq/Next.js) — real-time interview assistant
- School Management (MERN stack) — student/task management
- Contact Backend (FastAPI/PostgreSQL) — portfolio contact form
- Workflow Builder (React/TypeScript/Supabase) — visual workflow designer
- Crafty Canvas (React/TypeScript/Supabase) — expense tracking
- FastAPI Starter (FastAPI/SQLAlchemy/Docker) — backend template
- Audio Downloader (React/FastAPI/FFmpeg) — media downloader
- Usage Billing System (FastAPI/React/WebSockets) — billing platform
- Resume Analyzer (Streamlit/Ollama/Llama 3) — AI resume review
- Browser Camera (JavaScript/React) — camera app
- JavaScript Snake Game — classic game
- GitHub Profile README

Tech stack: Python, FastAPI, React, TypeScript, Vite, Tailwind CSS, PostgreSQL, Redis, Docker, Supabase, Groq, Next.js, Node.js, MongoDB, SQLAlchemy, WebSockets, GSAP, Three.js, Framer Motion.

Rules:
1. Answer from this context. If unsure, say so.
2. Give practical advice when relevant.
3. Keep answers focused and skimmable.`;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!GROQ_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  try {
    const { messages = [], project_id } = req.body || {};
    if (!messages.length) {
      return res.status(400).json({ error: "No messages provided" });
    }

    // Build messages for Groq
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-20).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    ];

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", response.status, err);
      return res.status(502).json({
        error: `LLM provider error (${response.status})`,
        reply: `I'm having trouble connecting to the AI service right now. Please try again in a moment. (Error: ${response.status})`
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response generated.";

    return res.status(200).json({
      reply,
      provider: "groq",
      model: GROQ_MODEL
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({
      error: err.message,
      reply: "Something went wrong. Please try again."
    });
  }
};
