// Vercel serverless function: GET /api/contacts, POST /api/contacts
// List and submit contact requests

const CONTACTS_DATA = [
  { id: 1, name: "Vikram Singh", topic: "Freelance project", email: "vikram@example.com", message: "Hi Anshul, I saw your dashboard and want to discuss a freelance project. Are you available?", created_at: "2026-08-17T11:00:00Z" },
  { id: 2, name: "Neha Gupta", topic: "Collaboration", email: "neha@example.com", message: "Would love to collaborate on an open-source project. Your React skills look great!", created_at: "2026-08-19T16:45:00Z" },
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json(CONTACTS_DATA);
  }

  if (req.method === "POST") {
    const { name, email, topic, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: "Name, email and message required" });
    return res.status(200).json({ id: Date.now(), name, email, topic: topic || "", message, created_at: new Date().toISOString() });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
