// Vercel serverless function: GET /api/summary
// Returns project counts: services, deployments, incidents keyed by project ID

const SERVICES = {
  1: 5,  // Demo Production API: API Gateway, Payments API, AI Worker, PostgreSQL, Redis
  2: 2,  // Portfolio: Vercel, Backend
};

const DEPLOYMENTS = {
  1: 2,
};

const INCIDENTS = {
  1: 1,
};

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const totalServices = Object.values(SERVICES).reduce((a, b) => a + b, 0);
  const totalDeployments = Object.values(DEPLOYMENTS).reduce((a, b) => a + b, 0);
  const totalIncidents = Object.values(INCIDENTS).reduce((a, b) => a + b, 0);
  const uptime = 99.99;

  return res.status(200).json({
    services: SERVICES,
    deployments: DEPLOYMENTS,
    incidents: INCIDENTS,
    totalServices,
    totalDeployments,
    totalIncidents,
    uptime,
  });
};
