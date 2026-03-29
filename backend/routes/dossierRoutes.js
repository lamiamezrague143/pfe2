const express = require('express');
const router = express.Router();
const { Dossier, PieceDossier } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// ✅ AJOUTER DOSSIER
router.post('/ajouter', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      nom_beneficiaire, 
      type_prestation, 
      fonction, 
      pieces_deposees, 
      montant_avenant
    } = req.body;

    const count = await Dossier.count() + 1;
    const num_sequence = `${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`;

    const dossier = await Dossier.create({
      num_sequence,
      nom_beneficiaire,
      type_prestation,
      fonction,
      montant_avenant: montant_avenant || 0,
    }, { transaction: t });

    if (pieces_deposees && pieces_deposees.length > 0) {
      const pieces = pieces_deposees.map(nom => ({
        nom,
        dossierId: dossier.id
      }));
      await PieceDossier.bulkCreate(pieces, { transaction: t });
    }

    await t.commit();

    // ✅ RENOMMÉ : as: 'piecesJointes'
    const dossierComplet = await Dossier.findByPk(dossier.id, {
      include: [{ model: PieceDossier, as: 'piecesJointes' }]
    });

    res.status(201).json(dossierComplet);
  } catch (error) {
    if (t) await t.rollback();
    console.error("Erreur Backend:", error.message);
    res.status(500).send(error.message);
  }
});

// ✅ LISTE GÉNÉRALE
router.get('/liste-generale', async (req, res) => {
  try {
    const { debut, fin } = req.query;
    let queryOptions = {
      order: [['createdAt', 'DESC']],
      // ✅ RENOMMÉ : as: 'piecesJointes'
      include: [{ model: PieceDossier, as: 'piecesJointes' }]
    };

    if (debut && fin) {
      queryOptions.where = {
        createdAt: { [Op.between]: [new Date(debut), new Date(fin)] }
      };
    }

    const dossiers = await Dossier.findAll(queryOptions);
    res.json(dossiers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ SUPPRIMER DOSSIER
router.delete('/:id', async (req, res) => {
  try {
    await Dossier.destroy({ where: { id: req.params.id } });
    res.json({ message: "Dossier supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;