const express = require("express");
const router = express.Router();

router.get("/profile", (req, res) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Access token required" });
  }
  res.json({ message: "Token presented (not verified yet)" });
});

module.exports = router;
