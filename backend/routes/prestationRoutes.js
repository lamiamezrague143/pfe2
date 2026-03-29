// Dans routes/prestationRoutes.js
const express = require('express');
const router = express.Router();

// TEST : Importe directement le fichier au lieu de passer par le dossier models
const Prestation = require('../models/Prestation');
// @route   GET /api/prestations/all
// @desc    Récupérer tous les types de prestations
router.get('/all', async (req, res) => {
    try {
        const prestations = await Prestation.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(prestations);
    } catch (err) {
        console.error("Erreur récupération prestations:", err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération" });
    }
});

// @route   POST /api/prestations/ajouter
// @desc    Créer un nouveau type de prestation
router.post('/ajouter', async (req, res) => {
    try {
        const { titre, pieces } = req.body;

        if (!titre) {
            return res.status(400).json({ message: "Le titre est obligatoire" });
        }

        const nouvellePrestation = await Prestation.create({
            titre,
            pieces: pieces // Sequelize gérera la conversion en JSON pour MySQL
        });

        res.status(201).json(nouvellePrestation);
    } catch (err) {
        console.error("Erreur ajout prestation:", err);
        res.status(500).json({ message: "Erreur serveur lors de l'ajout" });
    }
});
// @route   PUT /api/prestations/modifier/:id  ← NOUVEAU
router.put('/modifier/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titre, pieces } = req.body;
 
        if (!titre) {
            return res.status(400).json({ message: "Le titre est obligatoire" });
        }
 
        const prestation = await Prestation.findByPk(id);
        if (!prestation) {
            return res.status(404).json({ message: "Prestation non trouvée" });
        }
 
        await prestation.update({ titre, pieces });
 
        res.json(prestation);
    } catch (err) {
        console.error("Erreur modification prestation:", err);
        res.status(500).json({ message: "Erreur serveur lors de la modification" });
    }
});
// @route   DELETE /api/prestations/:id
// @desc    Supprimer une prestation (Optionnel mais utile)
router.delete('/:id', async (req, res) => {
    try {
        await Prestation.destroy({ where: { id: req.params.id } });
        res.json({ message: "Prestation supprimée avec succès" });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
});

module.exports = router;