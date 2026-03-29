const express = require('express');
const router = express.Router();
const { Setting } = require('../models');

// GET : Récupérer les plafonds
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST : Mettre à jour un plafond
router.post('/update', async (req, res) => {
  const { key, value } = req.body;
  try {
    await Setting.update({ value: String(value) }, { where: { key } });
    res.json({ message: "Mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ CORRECTION ICI : On exporte le ROUTER pour server.js
module.exports = router;