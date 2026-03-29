const express = require('express');
const router = express.Router();
// Importe tes modèles (vérifie bien le chemin vers ton dossier models)
const { PieceDossier } = require('../models'); 

// @route   POST /api/pieces/ajouter
router.post('/ajouter', async (req, res) => {
    try {
        console.log("Données reçues du Frontend :", req.body);

        // Tentative de création
        const nouvellePiece = await PieceDossier.create({
            nom: req.body.nom,
            prestationId: req.body.prestationId, // Doit être 11 selon ta BDD actuelle
            dossierId: req.body.dossierId
        });

        res.status(201).json(nouvellePiece);
    } catch (err) {
        // Affiche l'erreur précise dans ton terminal noir (le backend)
        console.error("❌ ERREUR SERVEUR (500) :");
        console.error(err.name, ":", err.message);

        // Réponse détaillée pour t'aider à corriger
        res.status(500).json({ 
            message: "Erreur lors de l'insertion en base de données",
            error: err.message,
            hint: "Vérifie si prestationId existe bien dans la table prestations"
        });
    }
});

module.exports = router;