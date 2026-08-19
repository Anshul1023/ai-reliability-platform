// Vercel serverless function: GET /api/summary
// Returns project counts for services, deployments, incidents

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.status(200).json({
    services: { 2: 2 },
    deployments: {},
    incidents: { 1: 1 }
  });
};
