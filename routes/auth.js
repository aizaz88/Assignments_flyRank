const requireAuth = require("../middleware/auth");
const express = require("express");
const supabase = require("../supabase");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ user: data.user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error)
    return res.status(401).json({ error: "Invalid login credentials" });
  res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: { id: data.user.id, email: data.user.email },
  });
});

router.post("/logout", requireAuth, async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});
module.exports = router;
