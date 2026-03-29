const express = require('express');
const router = express.Router();
const { Prestation } = require('../models'); 

// @route   GET /api/prestations/all
// @desc    Récupérer tous les types de prestations
router.get('/all', async (req, res) => {
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

// @route   POST /api/prestations/ajouter
// @desc    Créer un nouveau type de prestation
router.post('/ajouter', async (req, res) => {
    console.log("📥 Requête reçue sur /ajouter. Body :", req.body);
    
    try {
        const { titre, pieces } = req.body;
        
        // Validation de base
        if (!titre) {
            return res.status(400).json({ error: "Le titre est requis" });
        }

        // On crée la prestation. 
        // Note : Si votre colonne 'pieces' dans MySQL est de type JSON, 
        // pas besoin de stringify. Si c'est du TEXT, Sequelize s'en occupe 
        // souvent via les 'getters/setters' du modèle.
        const nouvellePrestation = await Prestation.create({
            titre: titre.trim(),
            pieces: Array.isArray(pieces) ? pieces : []
        });

        console.log("✅ Prestation créée avec succès :", nouvellePrestation.id);
        res.status(201).json(nouvellePrestation);
        
    } catch (error) {
        console.error("🔥 Erreur SQL lors de l'ajout :", error);
        res.status(500).json({ 
            error: "Erreur lors de la création", 
            details: error.message 
        });
    }
});

// @route   PUT /api/prestations/modifier/:id
// @desc    Modifier une prestation existante
router.put('/modifier/:id', async (req, res) => {
    console.log(`📝 Modification de la prestation ID: ${req.params.id}`);
    
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

// @route   DELETE /api/prestations/:id
// @desc    Supprimer une prestation
router.delete('/:id', async (req, res) => {
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