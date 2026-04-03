const express = require('express');
const router = express.Router();

// ✅ FIX IMPORTANT : import direct du modèle
const Setting = require('../models/Setting');

// ─────────────────────────────────────────────
// GET : Récupérer tous les settings
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.findAll();

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);

  } catch (err) {
    console.error("Erreur GET settings:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────
// POST : Mettre à jour un plafond
// ─────────────────────────────────────────────
router.post('/update', async (req, res) => {
  try {
    const { key, value } = req.body;

    // ✅ Validation propre
    if (!key || value === undefined) {
      return res.status(400).json({ error: "key et value sont requis" });
    }

    console.log("UPDATE SETTING:", key, value);

    // ✅ Chercher le setting
    let setting = await Setting.findByPk(key);

    if (setting) {
      // Mise à jour
      await setting.update({ value: String(value) });
    } else {
      // Création
      setting = await Setting.create({ key, value: String(value) });
    }

    res.json({
      success: true,
      message: "Mis à jour avec succès",
      setting
    });

  } catch (err) {
    console.error("❌ Erreur update setting:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────
module.exports = router;