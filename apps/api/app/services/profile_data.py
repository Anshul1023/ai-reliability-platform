"""Public owner profile — served by GET /profile for the About page.

Sourced from Anshul's resume (anshulcv2025.pdf). Edit freely; it is public.
"""

PROFILE = {
    "name": "Anshul Rawat",
    "title": "Full Stack Developer",
    "tagline": "I build fast, resilient web apps. From pixel-perfect React frontends to async FastAPI backends with Docker, Redis and real observability.",
    "summary": (
        "Full Stack Developer with hands-on experience building scalable, high-performance, "
        "responsive web apps. Skilled in React.js, FastAPI, PostgreSQL, Docker, CI/CD and modern "
        "DevOps practices. I love turning ideas into products that feel fast and never break."
    ),
    "about": [
        (
            "I'm a Full Stack Developer from Faridabad, Haryana, currently building the B2C longevity "
            "& fitness product at Odds Fitness across iOS and Android — shipping features end-to-end, "
            "from pixel-perfect UI to async FastAPI backends."
        ),
        (
            "At SGSN Associates I built production-grade React apps, optimized Postgres queries and "
            "containerized backends with Docker, diving into CI/CD with Prometheus and Grafana "
            "observability. Earlier at Interpe I cut my teeth on responsive UI and reusable components."
        ),
        (
            "I believe great software is invisible: it feels fast, never breaks, and scales quietly. "
            "That's why I obsess over observability, caching with Redis, and clean architecture in "
            "everything I ship."
        ),
    ],
    "phone": "+91 9953540593",
    "email": "anshulrawat5124@gmail.com",
    "location": "Faridabad, Haryana, India",
    "links": {
        "github": "https://github.com/Anshul1023",
        "linkedin": "https://www.linkedin.com/in/anshul-rawat-235019290",
        "portfolio": "https://anshul-rawat-portfolio.vercel.app",
    },
    "skills": [
        "React.js",
        "JavaScript (ES6+)",
        "TypeScript",
        "HTML5",
        "CSS3",
        "Tailwind CSS",
        "Vite",
        "Python",
        "FastAPI",
        "PostgreSQL",
        "Docker",
        "Git & GitHub",
        "CI/CD (Basic)",
        "Prometheus & Grafana",
        "Redis",
        "AI Tools: ChatGPT, Copilot, Cursor.dev, LangChain",
    ],
    "experience": [
        {
            "role": "Software Engineer",
            "company": "Odds Fitness, Delhi",
            "period": "May 2026 – Present",
            "points": [
                "Building the B2C longevity & fitness product across iOS and Android — end-to-end features, integrations and scalable product experiences.",
                "Built AI agents and AI-powered workflows (RAG, embeddings, vector search) to automate tasks and power user-facing intelligence.",
                "Automated internal workflows with Slack integration and marketing automation tools, applying best practices with Claude Code and OpenClaw.",
            ],
        },
        {
            "role": "Full Stack Developer Intern",
            "company": "SGSN Associates Pvt Ltd, Rishikesh",
            "period": "Aug 2025 – Nov 2025",
            "points": [
                "Built production-grade React + Tailwind apps with reusable, scalable UI components.",
                "Developed FastAPI endpoints, optimized Postgres queries, and containerized the backend with Docker.",
                "Improved performance, observability & CI/CD pipelines using Prometheus, Redis, PgBouncer, Grafana.",
            ],
        },
        {
            "role": "Frontend Developer Intern",
            "company": "Interpe, Dehradun",
            "period": "Sep 2023 – Nov 2023",
            "points": [
                "Built responsive UI with HTML, CSS, JS; improved UI performance and reusable components.",
                "Implemented testing scripts, optimized layouts, and improved navigation flow.",
            ],
        },
    ],
    "projects": [
        {
            "name": "PulseOps — AI Reliability Platform",
            "desc": "Dockerized observability platform: FastAPI + React dashboard, GitHub/Vercel/Render monitoring, AI incident investigation with RAG chat.",
            "url": "https://github.com/Anshul1023/ai-reliability-platform",
        },
        {
            "name": "Anshul Rawat Portfolio",
            "desc": "Cinematic single-page portfolio (React + TypeScript + Tailwind, GSAP/Framer Motion/Three.js) with a contact API on Render.",
            "url": "https://github.com/Anshul1023/anshul-rawat-portfolio",
        },
        {
            "name": "FastAPI Web Accelerator",
            "desc": "High-performance FastAPI system with async handling, Redis caching and optimized DB access.",
            "url": "https://github.com/Anshul1023/Fastapi",
        },
        {
            "name": "SwipeNRise",
            "desc": "Complete React frontend with animations, modular UI and accessibility improvements.",
            "url": "",
        },
        {
            "name": "Browser Camera",
            "desc": "Web camera app using getUserMedia — HTML, CSS, JavaScript.",
            "url": "https://github.com/Anshul1023/browser-camera",
        },
        {
            "name": "Snake Game (JS)",
            "desc": "Grid-based game engine with smooth animations and collision detection.",
            "url": "https://github.com/Anshul1023/JavaScript-Snake-game",
        },
    ],
    "education": [
        {"degree": "B.Tech — Computer Science", "school": "Uttaranchal University, Dehradun", "period": "2020 – 2024"},
        {"degree": "Senior Secondary", "school": "Faridabad, Haryana", "period": "2018 – 2020"},
    ],
    "languages": ["Hindi", "English"],
}
