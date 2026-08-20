// Vercel serverless function: GET /api/services?project_id=1
const SERVICES_BY_PROJECT = {
  1: [
    { id: 1, name: "API Gateway", status: "Healthy", latency_ms: 220, uptime: 99.9, check_url: "", last_checked: "2026-08-10T05:35:41Z" },
    { id: 2, name: "Payments API", status: "Healthy", latency_ms: 245, uptime: 99.9, check_url: "", last_checked: "2026-08-10T05:35:41Z" },
    { id: 3, name: "AI Worker", status: "Degraded", latency_ms: 612, uptime: 99.9, check_url: "", last_checked: "2026-08-10T05:35:41Z" },
    { id: 4, name: "PostgreSQL", status: "Healthy", latency_ms: 32, uptime: 99.9, check_url: "", last_checked: "2026-08-10T05:35:41Z" },
    { id: 5, name: "Redis", status: "Healthy", latency_ms: 4, uptime: 99.9, check_url: "", last_checked: "2026-08-10T05:35:41Z" },
  ],
  2: [
    { id: 6, name: "Vercel", status: "Healthy", latency_ms: 262, uptime: 99.99, check_url: "https://anshul-rawat-portfolio.vercel.app", last_checked: "2026-08-10T04:27:08Z" },
  ],
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const pid = Number(req.query.project_id || req.query.projectId);
  const data = pid ? (SERVICES_BY_PROJECT[pid] || []) : [];
  return res.status(200).json(data);
}
