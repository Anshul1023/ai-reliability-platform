// Vercel serverless function: GET /api/analytics
// Returns analytics data for the dashboard

const DAILY_VIEWS = [
  { date: "2026-08-14", views: 12, visitors: 5 },
  { date: "2026-08-15", views: 18, visitors: 8 },
  { date: "2026-08-16", views: 25, visitors: 11 },
  { date: "2026-08-17", views: 31, visitors: 14 },
  { date: "2026-08-18", views: 22, visitors: 9 },
  { date: "2026-08-19", views: 45, visitors: 20 },
  { date: "2026-08-20", views: 38, visitors: 17 },
];

const PER_PROJECT = [
  { id: 3, name: "ai-reliability-platform", views: 52 },
  { id: 2, name: "anshul-rawat-portfolio", views: 38 },
  { id: 4, name: "interview-agent", views: 28 },
  { id: 7, name: "school-management", views: 19 },
  { id: 11, name: "workflow-builder", views: 14 },
];

const PER_PATH = [
  { path: "/overview", views: 45 },
  { path: "/projects", views: 38 },
  { path: "/about", views: 32 },
  { path: "/ai-chat", views: 22 },
  { path: "/analytics", views: 18 },
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const totalViews = DAILY_VIEWS.reduce((s, d) => s + d.views, 0);
  const uniqueVisitors = 42;

  return res.status(200).json({
    total_views: totalViews,
    unique_visitors: uniqueVisitors,
    daily: DAILY_VIEWS,
    per_project: PER_PROJECT,
    per_path: PER_PATH,
  });
}
