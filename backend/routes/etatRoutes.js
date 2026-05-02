const express = require('express');
const router = express.Router();

const Etat = require('../models/Etat');
const LigneEtat = require('../models/LigneEtat');
const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 🟢 LISTE ETATS (ingénieur + président)
router.get('/', auth(["ingenieur", "president"]), async (req, res) => {
  try {
    const etats = await Etat.findAll({ order: [['createdAt', 'DESC']] });
    res.json(etats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 CREATE ETAT (ingénieur seulement)
router.post('/', auth(["ingenieur"]), async (req, res) => {
  const { lignes, ...etatData } = req.body;

  try {
    if (!lignes || !Array.isArray(lignes)) {
      return res.status(400).json({ error: "lignes invalides" });
    }

    const newEtat = await Etat.create(etatData);

    const lignesWithId = lignes.map(l => ({
      ...l,
      etatId: newEtat.id
    }));

    await LigneEtat.bulkCreate(lignesWithId);

    res.status(201).json(newEtat);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 GET LIGNES (ingénieur + président)
router.get('/:id/lignes', auth(["ingenieur", "president"]), async (req, res) => {
  try {
    const lignes = await LigneEtat.findAll({
      where: { etatId: req.params.id }
    });

    res.json(lignes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 UPDATE ETAT (ingénieur seulement)
router.put('/:id', auth(["ingenieur"]), async (req, res) => {
  const { lignes, ...etatData } = req.body;

  try {
    await Etat.update(etatData, {
      where: { id: req.params.id }
    });

    await LigneEtat.destroy({
      where: { etatId: req.params.id }
    });

    if (lignes && Array.isArray(lignes)) {
      const lignesWithId = lignes.map(l => ({
        ...l,
        etatId: req.params.id
      }));

      await LigneEtat.bulkCreate(lignesWithId);
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 DELETE ETAT (ingénieur seulement)
router.delete('/:id', auth(["ingenieur"]), async (req, res) => {
  try {
    await Etat.destroy({
      where: { id: req.params.id }
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;