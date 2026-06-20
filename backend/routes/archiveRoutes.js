const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Archive = require('../models/Archive');
const { Op } = require('sequelize');
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 👑 UPLOAD (président uniquement)
router.post('/upload', authMiddleware(["president"]), upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Aucun fichier reçu" });
    }
const fichiers = req.files.map(file => ({
  nom: file.originalname,
  url: `uploads/${file.filename}`,
  type: file.mimetype,
  taille: file.size
}));
    const archive = await Archive.create({
      nomDossier: req.body.nomDossier,
      fichiers
    });

    res.status(201).json(archive);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// 👑 GET (président uniquement)
router.get("/", authMiddleware(["president"]), async (req, res) => {
  const { search } = req.query;

  const where = search
    ? { nomDossier: { [Op.like]: `%${search}%` } }
    : {};

  const archives = await Archive.findAll({
    where,
    order: [["createdAt", "DESC"]]
  });

  res.json(archives);
});

// 👑 DELETE (président uniquement)
router.delete("/:id", authMiddleware(["president"]), async (req, res) => {
  await Archive.destroy({ where: { id: req.params.id } });
  res.json({ message: "Supprimé" });
});

// 👑 UPDATE (président uniquement)
router.put("/:id", authMiddleware(["president"]), async (req, res) => {
  const { nomDossier } = req.body;

  await Archive.update(
    { nomDossier },
    { where: { id: req.params.id } }
  );

  res.json({ message: "Modifié" });
});

module.exports = router;