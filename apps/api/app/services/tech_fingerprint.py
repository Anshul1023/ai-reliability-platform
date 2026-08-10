"""Tech fingerprinting — what technologies a project uses.

Reads dependency manifests from GitHub (package.json, requirements.txt, ...)
plus the README text and file tree, and produces a compact list of tech
labels (e.g. Redis, FastAPI, React) stored as the `tech` JSON document.
This is what lets the AI answer cross-project questions like
"which project uses Redis?" from the global context.
"""

import base64
import re

import httpx

from app.core.config import settings

# Manifest candidates (repo-relative) -> parser id.
MANIFEST_PATHS = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "Pipfile",
    "go.mod",
    "Cargo.toml",
    "composer.json",
    "Gemfile",
    "pubspec.yaml",
    "environment.yml",
]

# keyword -> canonical tech label. Matching is done on lowercased dependency
# names, README text and file paths.
TECH_KEYWORDS: dict[str, str] = {
    "redis": "Redis", "ioredis": "Redis", "redis-py": "Redis", "django-redis": "Redis",
    "postgres": "PostgreSQL", "postgresql": "PostgreSQL", "psycopg": "PostgreSQL",
    "sqlalchemy": "SQLAlchemy", "sqlite": "SQLite", "prisma": "Prisma",
    "mongodb": "MongoDB", "pymongo": "MongoDB", "mongoose": "MongoDB", "mongo": "MongoDB",
    "mysql": "MySQL",
    "docker": "Docker", "dockerfile": "Docker",
    "react": "React", "vue": "Vue", "svelte": "Svelte",
    "next": "Next.js", "nextjs": "Next.js", "nuxt": "Nuxt",
    "fastapi": "FastAPI", "flask": "Flask", "django": "Django",
    "express": "Express", "node": "Node.js", "nodejs": "Node.js",
    "typescript": "TypeScript", "javascript": "JavaScript", "python": "Python",
    "tailwind": "Tailwind CSS", "three": "Three.js", "threejs": "Three.js",
    "framer-motion": "Framer Motion", "framer": "Framer Motion", "gsap": "GSAP",
    "vite": "Vite", "webpack": "Webpack",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch", "keras": "Keras", "scikit-learn": "scikit-learn",
    "langchain": "LangChain", "openai": "OpenAI", "groq": "Groq", "anthropic": "Anthropic", "claude": "Claude",
    "supabase": "Supabase", "firebase": "Firebase",
    "vercel": "Vercel", "railway": "Railway", "render": "Render", "netlify": "Netlify",
    "celery": "Celery", "kafka": "Kafka", "rabbitmq": "RabbitMQ", "bullmq": "BullMQ", "bull": "Bull",
    "graphql": "GraphQL", "grpc": "gRPC", "websocket": "WebSockets", "socket.io": "Socket.IO",
    "jwt": "JWT", "oauth": "OAuth", "stripe": "Stripe",
    "puppeteer": "Puppeteer", "playwright": "Playwright", "selenium": "Selenium",
    "pytest": "pytest", "jest": "Jest", "vitest": "Vitest", "cypress": "Cypress",
    "html": "HTML", "css": "CSS", "sass": "Sass", "bootstrap": "Bootstrap",
    "aws": "AWS", "azure": "Azure", "gcp": "GCP", "cloudflare": "Cloudflare",
    "telegram": "Telegram API", "discord": "Discord API", "slack": "Slack API",
    "notion": "Notion API", "googleapis": "Google APIs",
    "pdf": "PDF", "excel": "Excel", "openpyxl": "Excel", "pandas": "Pandas", "numpy": "NumPy",
    "ffmpeg": "FFmpeg", "opencv": "OpenCV",
    "helm": "Helm", "kubernetes": "Kubernetes", "terraform": "Terraform",
    "nginx": "Nginx", "prometheus": "Prometheus", "grafana": "Grafana",
}


def _parse_manifest(path: str, content: str) -> list[str]:
    """Extract dependency names from a manifest file (best-effort per type)."""
    text = content.lower()
    names: list[str] = []

    def add_json_deps(raw: str, keys: tuple[str, ...]) -> None:
        import json

        try:
            data = json.loads(raw)
        except Exception:  # noqa: BLE001
            return
        for key in keys:
            deps = data.get(key) or {}
            if isinstance(deps, dict):
                names.extend(deps.keys())
            elif isinstance(deps, list):
                names.extend(deps)

    if path.endswith("package.json"):
        add_json_deps(content, ("dependencies", "devDependencies", "peerDependencies"))
    elif path.endswith("requirements.txt") or path.endswith("Pipfile"):
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith(("#", "-", "[")):
                continue
            names.append(re.split(r"[=<>!~; ]+", line)[0])
    elif path.endswith("pyproject.toml"):
        # dependencies = ["a", "b>=1", {name = "c"}]
        names.extend(re.findall(r'["\']([a-zA-Z0-9_.-]+)["\']', content))
    elif path.endswith("go.mod"):
        for line in content.splitlines():
            parts = line.split()
            if parts and not parts[0].startswith(("module", "go", "require", ")")):
                names.append(parts[0])
    elif path.endswith("Cargo.toml"):
        names.extend(re.findall(r'^([a-zA-Z0-9_-]+)\s*=', content, re.M))
    elif path.endswith("composer.json"):
        add_json_deps(content, ("require", "require-dev"))
    elif path.endswith("Gemfile"):
        for line in content.splitlines():
            m = re.match(r"\s*gem\s+['\"]([^'\"]+)", line)
            if m:
                names.append(m.group(1))
    elif path.endswith("pubspec.yaml") or path.endswith("environment.yml"):
        for line in content.splitlines():
            m = re.match(r"\s*-\s*([a-zA-Z0-9_.-]+)", line)
            if m:
                names.append(m.group(1))
    return [n for n in names if n]


async def build_tech_fingerprint(repo: str, ctx: dict) -> dict:
    """Produce {tech: [...], dependencies: {manifest: [names]}} for a repo."""
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    dependencies: dict[str, list[str]] = {}
    # Read a bounded set of manifests from the repo root.
    async with httpx.AsyncClient(timeout=20) as client:
        for path in MANIFEST_PATHS:
            try:
                r = await client.get(f"{settings.github_api_url}/repos/{repo}/contents/{path}", headers=headers)
                if r.status_code != 200:
                    continue
                data = r.json()
                if isinstance(data, dict) and data.get("content"):
                    content = base64.b64decode(data["content"]).decode("utf-8", "replace")
                    names = _parse_manifest(path, content)
                    if names:
                        dependencies[path] = names
            except Exception:  # noqa: BLE001 - best-effort
                continue

    # Keyword corpus: manifest dep names + README text + file paths.
    corpus: list[str] = []
    for names in dependencies.values():
        corpus.extend(names)
    readme = (ctx.get("readme") or "")[:8000].lower()
    corpus.append(readme)
    files = ctx.get("files") or []
    corpus.extend(files)

    # Tokenize on non-alphanumeric boundaries but keep internal . _ - so
    # hyphenated/dotted keywords (framer-motion, socket.io, scikit-learn) match
    # as whole tokens, while "node" never matches "node_modules" or "redis"
    # "redisearch".
    tokens = set(re.findall(r"[a-z0-9][a-z0-9._-]*", " ".join(corpus).lower()))
    tech = sorted({label for keyword, label in TECH_KEYWORDS.items() if keyword in tokens})
    return {"tech": tech, "dependencies": dependencies}
