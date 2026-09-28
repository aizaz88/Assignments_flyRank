const express = require("express");
const supabase = require("../supabase");
const router = express.Router();

router.get("/profile", async (req, res) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const u = data.user;
  res.status(200).json({ id: u.id, email: u.email, created_at: u.created_at });
});

module.exports = router;
