const express = require('express');
const router = express.Router();
const TypesPrestations = require('../models/TypesPrestations');
const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 📥 LISTE (président uniquement)
router.get('/', auth(["president"]), async (req, res) => {
  try {
    const data = await TypesPrestations.findAll({
      where: { actif: 1 }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ➕ AJOUT (président uniquement)
router.post("/", auth(["president"]), async (req, res) => {
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

// ✏️ MODIFIER (président uniquement)
router.put("/:id", auth(["president"]), async (req, res) => {
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

// 🗑️ SUPPRESSION LOGIQUE (président uniquement)
router.delete("/:id", auth(["president"]), async (req, res) => {
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

module.exports = router;