// Vercel serverless function: GET /api/feedback, POST /api/feedback
// List and submit visitor feedback

const FEEDBACK_DATA = [
  { id: 1, name: "Priya Sharma", message: "Love the AI chat feature! Super smooth.", rating: 5, created_at: "2026-08-18T10:30:00Z" },
  { id: 2, name: "Rahul Verma", message: "Great portfolio. The animations are impressive.", rating: 4, created_at: "2026-08-19T14:20:00Z" },
  { id: 3, name: "Sneha Patel", message: "Very professional dashboard. Would love to see more project details.", rating: 4, created_at: "2026-08-20T09:15:00Z" },
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json(FEEDBACK_DATA);
  }

  if (req.method === "POST") {
    const { name, message, rating } = req.body || {};
    if (!name || !message) return res.status(400).json({ error: "Name and message required" });
    return res.status(200).json({ id: Date.now(), name, message, rating: rating || 5, created_at: new Date().toISOString() });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
