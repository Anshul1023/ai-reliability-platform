// Vercel serverless function: GET /api/profile
// Returns full profile/resume data

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  return res.status(200).json({
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
      portfolio: "https://anshul-rawat-portfolio.vercel.app",
    },
    skills: [
      "React.js", "JavaScript (ES6+)", "TypeScript", "HTML5", "CSS3",
      "Tailwind CSS", "Vite", "Python", "FastAPI", "PostgreSQL",
      "Docker", "Git & GitHub", "CI/CD (Basic)", "Prometheus & Grafana",
      "Redis", "AI Tools: ChatGPT, Copilot, Cursor.dev, LangChain",
    ],
    experience: [
      {
        role: "Full Stack Developer",
        company: "Odds Fitness",
        period: "2025 — Present",
        points: [
          "Built and shipped production React + FastAPI features used by real users",
          "Implemented AI-powered content generation using RAG, vector search, and LLM agents",
          "Set up Docker containerization, Redis caching, and Prometheus + Grafana monitoring",
          "Designed RESTful APIs with PostgreSQL, async Python, and real-time WebSocket updates",
        ],
      },
      {
        role: "Frontend Developer",
        company: "SGS Onsite Solutions",
        period: "2024 — 2025",
        points: [
          "Developed responsive dashboards and client-facing web apps using React and TypeScript",
          "Integrated third-party APIs and implemented state management with Redux and Context API",
          "Improved performance by 40% through code splitting, lazy loading, and memoization",
          "Collaborated with design teams to implement pixel-perfect UI from Figma mockups",
        ],
      },
      {
        role: "Web Development Intern",
        company: "Interpe Inc",
        period: "2023 — 2024",
        points: [
          "Built landing pages and internal tools using HTML, CSS, JavaScript, and React",
          "Learned Git workflows, code reviews, and agile sprint methodology",
          "Contributed to open-source projects and gained experience with CI/CD pipelines",
        ],
      },
    ],
    education: [
      {
        degree: "Bachelor of Technology in Computer Science",
        school: "Manav Rachna University, Faridabad",
        period: "2021 — 2025",
      },
    ],
    languages: ["Hindi", "English"],
  });
}
