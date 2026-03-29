const express = require("express");
const router = express.Router();
const Prise = require("../models/Prise");
const { Op } = require("sequelize"); 

// 1. ✅ ENREGISTRER
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };

    // --- Nettoyage des dates ---
    const dateFields = ['conventionStartDate', 'conventionEndDate', 'nbDate'];
    
    dateFields.forEach(field => {
      if (!data[field] || data[field] === "Invalid date" || data[field] === "") {
        data[field] = null; 
      }
    });

    // --- Conversion des montants ---
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
    return res.status(500).json({ 
      error: "Erreur lors de la sauvegarde", 
      details: err.message 
    });
  }
});


// 2. ✅ CONSULTER AVEC RECHERCHE
router.get("/all", async (req, res) => {
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

    return res.json(prises || []);
  } catch (err) {
    console.error("Erreur liste:", err);
    return res.status(500).json({ 
      error: "Impossible de charger la liste" 
    });
  }
});


// 3. ✅ PROCHAIN NUMÉRO
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
    return res.status(500).json({ 
      error: "Erreur serveur compteur" 
    });
  }
});


// 4. ✅ SUPPRIMER
router.delete("/:id", async (req, res) => {
  try {
    await Prise.destroy({ where: { id: req.params.id } });
    res.json({ message: "Supprimé ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur suppression" });
  }
});




router.put("/annuler/:id", async (req, res) => {
  try {
    const prise = await Prise.findByPk(req.params.id); // ✅ Sequelize

    if (!prise) {
      return res.status(404).json({ message: "Prise introuvable" });
    }

    prise.status = "annulé";
    await prise.save();

    res.json({ message: "Annulé avec succès" });

  } catch (err) {
    console.error("Erreur annulation:", err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;