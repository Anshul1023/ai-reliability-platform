// Vercel serverless function: GET /api/deployments?project_id=1
const DEPLOYMENTS = [
  { id: 1, project_id: 1, sha: "a1b2c3d", message: "Fix payment gateway timeout", author: "Anshul", status: "success", created_at: "2026-08-09T14:30:00Z" },
  { id: 2, project_id: 1, sha: "e4f5g6h", message: "Add Redis caching layer", author: "Anshul", status: "success", created_at: "2026-08-08T10:15:00Z" },
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const pid = Number(req.query.project_id || req.query.projectId);
  const data = pid ? DEPLOYMENTS.filter(d => d.project_id === pid) : [];
  return res.status(200).json(data);
}
