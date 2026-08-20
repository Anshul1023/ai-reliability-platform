// Vercel serverless function: GET /api/incidents
const INCIDENTS = [
  { id: 1, project_id: 1, title: "Payment API latency spike", service: "Payments API", severity: "Critical", status: "Investigating", created_at: "2026-08-10T05:35:43Z", resolved_at: null },
];

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  return res.status(200).json(INCIDENTS);
};
