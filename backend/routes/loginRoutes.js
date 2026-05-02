const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ message: "Mot de passe incorrect" });
  }

  // 🔐 TOKEN
  const token = jwt.sign(
    { id: user.id, role: user.roleSystem },
    process.env.JWT_SECRET || "SECRET_KEY",
    { expiresIn: "1d" }
  );

  // ✅ réponse propre
  res.json({
    token,
    role: user.roleSystem,
    id: user.id,
    firstLogin: user.firstLogin
  });
});

module.exports = router;