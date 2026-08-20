// Vercel serverless function: POST /api/auth
// Pydantic-style JWT auth for admin login

const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "pulseops-secret-key-change-in-production";
const ADMIN_EMAIL = "anshulrawat5124@gmail.com";
const ADMIN_PASSWORD = "Godsplan1023@@";

// Simple JWT implementation (no external deps needed)
function base64url(str) {
  return Buffer.from(str).toString("base64url");
}

function sign(payload, secret) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(header + "." + body).digest("base64url");
  return header + "." + body + "." + sig;
}

function verify(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(header + "." + body).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error("Token expired");
  return payload;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET /api/auth — verify existing token
  if (req.method === "GET") {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    try {
      const payload = verify(token, JWT_SECRET);
      return res.status(200).json({ id: payload.sub, email: payload.email, role: payload.role });
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  // POST /api/auth — login or register
  if (req.method === "POST") {
    try {
      const { email, password, action } = req.body || {};

      if (action === "login" || (!action && email && password)) {
        // Login
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = sign({
          sub: "user_admin",
          email: ADMIN_EMAIL,
          role: "admin",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days
        }, JWT_SECRET);
        const refresh = sign({
          sub: "user_admin",
          type: "refresh",
          exp: Math.floor(Date.now() / 1000) + 86400 * 90 // 90 days
        }, JWT_SECRET);
        return res.status(200).json({
          access_token: token,
          refresh_token: refresh,
          token_type: "bearer",
          user: { id: "user_admin", email: ADMIN_EMAIL, role: "admin" }
        });
      }

      if (action === "refresh") {
        const { refresh_token } = req.body || {};
        if (!refresh_token) return res.status(400).json({ error: "No refresh token" });
        try {
          const payload = verify(refresh_token, JWT_SECRET);
          if (payload.type !== "refresh") throw new Error("Not a refresh token");
          const token = sign({
            sub: payload.sub,
            email: ADMIN_EMAIL,
            role: "admin",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400 * 30
          }, JWT_SECRET);
          return res.status(200).json({ access_token: token, token_type: "bearer" });
        } catch (e) {
          return res.status(401).json({ error: "Invalid refresh token" });
        }
      }

      return res.status(400).json({ error: "Provide email + password to login" });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
