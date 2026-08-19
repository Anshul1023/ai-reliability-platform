module.exports = function handler(req, res) {
  res.status(200).json({
    status: "ok",
    groq_key_set: !!process.env.GROQ_API_KEY,
    ai_model: process.env.AI_MODEL || "not set",
    timestamp: new Date().toISOString()
  });
};
