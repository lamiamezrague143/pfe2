const express = require("express");
const router = express.Router();
const Prise = require("../models/Prise");
const { Op } = require("sequelize");
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 🟢 ENREGISTRER (agent + président)
router.post("/", authMiddleware(["agent", "president"]), async (req, res) => {
  try {
    const data = { ...req.body };

    const dateFields = ['conventionStartDate', 'conventionEndDate', 'nbDate'];

    dateFields.forEach(field => {
      if (!data[field] || data[field] === "Invalid date" || data[field] === "") {
        data[field] = null;
      }
    });

    data.montantTotal = parseFloat(data.montantTotal) || 0;
    data.montantOS = parseFloat(data.montantOS) || 0;
    data.montantPerso = parseFloat(data.montantPerso) || 0;

    const nouvellePrise = await Prise.create(data);

    res.status(201).json({
      message: "Enregistrement réussi ✅",
      prise: nouvellePrise
    });

  } catch (err) {
    console.error("ERREUR ENREGISTREMENT:", err);
    res.status(500).json({
      error: "Erreur lors de la sauvegarde",
      details: err.message
    });
  }
});

// 🟢 LISTE (agent + président)
router.get("/all", authMiddleware(["agent", "president","comptable"]), async (req, res) => {
  try {
    const { search } = req.query;

    let whereCondition = {};

    if (search) {
      whereCondition = {
        [Op.or]: [
          { pNom: { [Op.like]: `%${search}%` } },
          { pPrenom: { [Op.like]: `%${search}%` } },
          { numeroSequentiel: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const prises = await Prise.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    res.json(prises || []);

  } catch (err) {
    res.status(500).json({ error: "Impossible de charger la liste" });
  }
});

// 🟢 PROCHAIN NUMERO (agent + président)
router.get("/prochain-numero/:clinicId", authMiddleware(["agent", "president"]), async (req, res) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId || clinicId === "undefined") {
      return res.status(400).json({ error: "ID invalide" });
    }

    const count = await Prise.count({
      where: { sfEtablissement: clinicId }
    });

    res.json({ next: count + 1 });

  } catch (error) {
    res.status(500).json({ error: "Erreur serveur compteur" });
  }
});

// 🟢 DELETE (agent + président)
router.delete("/:id", authMiddleware(["agent", "president"]), async (req, res) => {
  try {
    await Prise.destroy({ where: { id: req.params.id } });
    res.json({ message: "Supprimé ✅" });

  } catch (err) {
    res.status(500).json({ message: "Erreur suppression" });
  }
});

// 🟢 ANNULER (agent + président)
router.put("/annuler/:id", authMiddleware(["agent", "president"]), async (req, res) => {
  try {
    const prise = await Prise.findByPk(req.params.id);

    if (!prise) {
      return res.status(404).json({ message: "Prise introuvable" });
    }

    prise.status = "annulé";
    prise.annule = true;

    await prise.save();

    res.json({ message: "Annulé avec succès" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;