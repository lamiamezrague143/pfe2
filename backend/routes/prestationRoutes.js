const express = require('express');
const router = express.Router();
const { Prestation } = require('../models');
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 🟢 GET ALL PRESTATIONS (secrétariat + président)
router.get('/all', authMiddleware(["secretariat", "president"]), async (req, res) => {
    try {
        const prestations = await Prestation.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.json(prestations);

    } catch (err) {
        console.error("❌ Erreur récupération prestations:", err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération" });
    }
});

// 🟢 AJOUT PRESTATION (secrétariat + président)
router.post('/ajouter', authMiddleware(["secretariat", "president"]), async (req, res) => {
    console.log("📥 Requête reçue sur /ajouter. Body :", req.body);

    try {
        const { titre, pieces } = req.body;

        if (!titre) {
            return res.status(400).json({ error: "Le titre est requis" });
        }

        const nouvellePrestation = await Prestation.create({
            titre: titre.trim(),
            pieces: Array.isArray(pieces) ? pieces : []
        });

        console.log("✅ Prestation créée :", nouvellePrestation.id);

        res.status(201).json(nouvellePrestation);

    } catch (error) {
        console.error("🔥 Erreur SQL :", error);
        res.status(500).json({
            error: "Erreur lors de la création",
            details: error.message
        });
    }
});

// 🟢 MODIFIER PRESTATION (secrétariat + président)
router.put('/modifier/:id', authMiddleware(["secretariat", "president"]), async (req, res) => {
    console.log(`📝 Modification prestation ID: ${req.params.id}`);

    try {
        const { titre, pieces } = req.body;

        const prestation = await Prestation.findByPk(req.params.id);

        if (!prestation) {
            return res.status(404).json({ message: "Prestation non trouvée" });
        }

        await prestation.update({
            titre: titre ? titre.trim() : prestation.titre,
            pieces: Array.isArray(pieces) ? pieces : prestation.pieces
        });

        res.json(prestation);

    } catch (err) {
        console.error("❌ Erreur modification prestation:", err);
        res.status(500).json({ message: "Erreur serveur lors de la modification" });
    }
});

// 🟢 SUPPRIMER PRESTATION (secrétariat + président)
router.delete('/:id', authMiddleware(["secretariat", "president"]), async (req, res) => {
    try {
        const result = await Prestation.destroy({
            where: { id: req.params.id }
        });

        if (result === 0) {
            return res.status(404).json({ message: "Prestation introuvable" });
        }

        res.json({ message: "Prestation supprimée avec succès" });

    } catch (err) {
        console.error("❌ Erreur suppression prestation:", err);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
});

module.exports = router;