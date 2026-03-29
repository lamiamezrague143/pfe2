const express = require('express');
const router = express.Router();

// ✅ CORRECTION DES IMPORTS : On importe les fichiers directement
const Etat = require('../models/Etat');
const LigneEtat = require('../models/LigneEtat');

// 1. Lister tous les états
router.get('/', async (req, res) => {
  try {
    const etats = await Etat.findAll({ order: [['createdAt', 'DESC']] });
    res.json(etats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Créer un nouvel état avec ses lignes
router.post('/', async (req, res) => {
  const { lignes, ...etatData } = req.body;
  
  try {
    // Vérification de sécurité
    if (!lignes || !Array.isArray(lignes)) {
      return res.status(400).json({ error: "Le tableau 'lignes' est manquant ou invalide." });
    }

    // Création de l'entête (L'objet Etat est maintenant bien défini)
    const newEtat = await Etat.create(etatData);

    // Association des lignes
    const lignesWithId = lignes.map(l => ({ 
      ...l, 
      etatId: newEtat.id 
    }));

    await LigneEtat.bulkCreate(lignesWithId);
    
    res.status(201).json(newEtat);
  } catch (err) {
    console.error("❌ Erreur Sequelize :", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Récupérer les lignes d'un état
router.get('/:id/lignes', async (req, res) => {
  try {
    const lignes = await LigneEtat.findAll({ where: { etatId: req.params.id } });
    res.json(lignes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Mettre à jour un état
router.put('/:id', async (req, res) => {
  const { lignes, ...etatData } = req.body;
  try {
    await Etat.update(etatData, { where: { id: req.params.id } });

    await LigneEtat.destroy({ where: { etatId: req.params.id } });
    
    if (lignes && Array.isArray(lignes)) {
        const lignesWithId = lignes.map(l => ({ ...l, etatId: req.params.id }));
        await LigneEtat.bulkCreate(lignesWithId);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Supprimer un état
router.delete('/:id', async (req, res) => {
  try {
    await Etat.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;