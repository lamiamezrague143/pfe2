const express = require('express');
const router = express.Router();

const { PieceDossier } = require('../models');
//const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 🟢 AJOUT PIÈCE (président + secrétariat)
router.post('/ajouter',  async (req, res) => {
    try {
        console.log("Données reçues du Frontend :", req.body);

        const nouvellePiece = await PieceDossier.create({
            nom: req.body.nom,
            prestationId: req.body.prestationId,
            dossierId: req.body.dossierId
        });

        res.status(201).json(nouvellePiece);

    } catch (err) {
        console.error("❌ ERREUR SERVEUR (500) :");
        console.error(err.name, ":", err.message);

        res.status(500).json({
            message: "Erreur lors de l'insertion en base de données",
            error: err.message,
            hint: "Vérifie si prestationId existe bien dans la table prestations"
        });
    }
});

module.exports = router;