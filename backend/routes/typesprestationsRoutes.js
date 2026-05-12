const express = require('express');
const router = express.Router();
const TypesPrestations = require('../models/TypesPrestations');
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 📥 LISTE (président uniquement)
router.get('/', authMiddleware(["beneficiaire","agent","president"]), async (req, res) => {
  try {
    const data = await TypesPrestations.findAll({
      where: { actif: true }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ➕ AJOUT (président uniquement)
router.post("/", authMiddleware(["president"]), async (req, res) => {
  try {
    const { nom } = req.body;

    const newType = await TypesPrestations.create({
      nom,
      actif: true
    });

    res.json(newType);
  } catch (err) {
    res.status(500).json({ error: "Erreur ajout" });
  }
});

// ✏️ UPDATE (président uniquement)
router.put("/:id", authMiddleware(["president"]), async (req, res) => {
  try {
    const { nom, actif } = req.body;

    await TypesPrestations.update(
      { nom, actif },
      { where: { id: req.params.id } }
    );

    res.json({ message: "Modifié" });
  } catch (err) {
    res.status(500).json({ error: "Erreur update" });
  }
});

// 🗑️ DELETE LOGIQUE (président uniquement)
router.delete("/:id", authMiddleware(["president"]), async (req, res) => {
  try {
    await TypesPrestations.update(
      { actif: false },
      { where: { id: req.params.id } }
    );

    res.json({ message: "Supprimé" });
  } catch (err) {
    res.status(500).json({ error: "Erreur delete" });
  }
});

// 🔍 TEST ROUTE (président uniquement)
router.get("/clinique/:id", authMiddleware(["president"]), (req, res) => {
  console.log("ROUTE OK - ID:", req.params.id);
  res.json({ test: "route fonctionne" });
});

module.exports = router;