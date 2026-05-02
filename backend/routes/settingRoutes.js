const express = require('express');
const router = express.Router();

const Setting = require('../models/Setting');
const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// ─────────────────────────────
// GET : settings (président uniquement)
// ─────────────────────────────
router.get('/', auth(["president"]), async (req, res) => {
  try {
    const settings = await Setting.findAll();

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);

  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────
// POST : update settings (président uniquement)
// ─────────────────────────────
router.post('/update', auth(["president"]), async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: "key et value sont requis" });
    }

    let setting = await Setting.findByPk(key);

    if (setting) {
      await setting.update({ value: String(value) });
    } else {
      setting = await Setting.create({ key, value: String(value) });
    }

    res.json({
      success: true,
      message: "Mis à jour avec succès",
      setting
    });

  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;