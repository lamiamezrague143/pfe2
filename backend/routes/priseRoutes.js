const express = require("express");
const router = express.Router();
const Prise = require("../models/Prise");
const { Op } = require("sequelize"); 

// 1. ✅ ENREGISTRER (POST /api/prise-en-charge/)
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };

    // --- SÉCURITÉ : Nettoyage des dates ---
    const dateFields = ['conventionStartDate', 'conventionEndDate', 'nbDate'];
    
    dateFields.forEach(field => {
      // Si la date est invalide, vide ou contient "Invalid date", on met NULL
      if (!data[field] || data[field] === "Invalid date" || data[field] === "") {
        data[field] = null; 
      }
    });

    // On s'assure que les montants sont des nombres
    data.montantTotal = parseFloat(data.montantTotal) || 0;
    data.montantOS = parseFloat(data.montantOS) || 0;
    data.montantPerso = parseFloat(data.montantPerso) || 0;

    const nouvellePrise = await Prise.create(data);
    
    return res.status(201).json({ 
      message: "Enregistrement réussi ✅", 
      prise: nouvellePrise 
    });

  } catch (err) {
    console.error("ERREUR ENREGISTREMENT:", err);
    return res.status(500).json({ error: "Erreur lors de la sauvegarde", details: err.message });
  }
});
// 2. ✅ CONSULTER TOUT (GET /api/prise-en-charge/all)
// ✅ CONSULTER AVEC RECHERCHE (GET /api/prise-en-charge/all)
router.get("/all", async (req, res) => {
  try {
    const { search } = req.query;
    let whereCondition = {};

    // Si l'utilisateur tape quelque chose dans la barre de recherche
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

    return res.json(prises || []);
  } catch (err) {
    console.error("Erreur liste:", err);
    return res.status(500).json({ error: "Impossible de charger la liste" });
  }
});
// 3. ✅ PROCHAIN NUMÉRO PAR CLINIQUE (GET /api/prise-en-charge/prochain-numero/:clinicId)
router.get("/prochain-numero/:clinicId", async (req, res) => {
  try {
    const { clinicId } = req.params;

    if (!clinicId || clinicId === "undefined") {
      return res.status(400).json({ error: "ID de clinique invalide" });
    }

    const count = await Prise.count({
      where: { sfEtablissement: clinicId }
    });

    return res.json({ next: count + 1 });
  } catch (error) {
    console.error("Erreur count:", error);
    return res.status(500).json({ error: "Erreur serveur compteur" });
  }
});

// 4. ✅ SUPPRIMER (DELETE /api/prise-en-charge/:id)
router.delete("/:id", async (req, res) => {
  try {
    await Prise.destroy({ where: { id: req.params.id } });
    res.json({ message: "Supprimé ✅" });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression" });
  }
});

module.exports = router;