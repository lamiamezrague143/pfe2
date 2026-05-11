const express = require('express');
const router = express.Router();
const { Dossier, PieceDossier } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
//const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// ✅ AJOUTER DOSSIER (président + secrétariat)
router.post('/ajouter', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      nom_beneficiaire,
      type_prestation,
      fonction,
      pieces_deposees,
      montant_avenant,
      faculte,
      numero_dossier,
      avis_commission,
      date_depart_retraite,
      nom_defunt,
      nom_enfant,
      date_mariage
    } = req.body;

    const count = await Dossier.count();
    const num_sequence = `${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    const dossier = await Dossier.create({
      num_sequence,
      numero_dossier,
      nom_beneficiaire,
      type_prestation,
      fonction,
      faculte,
      montant_avenant: montant_avenant ? parseFloat(montant_avenant) : 0,
      avis_commission: avis_commission || 'En attente',
      date_depart_retraite: date_depart_retraite || null,
      nom_defunt: nom_defunt || null,
      nom_enfant: nom_enfant || null,
      date_mariage: date_mariage || null,
    }, { transaction: t });

    if (Array.isArray(pieces_deposees) && pieces_deposees.length > 0) {
      const pieces = pieces_deposees.map(nom => ({
        nom,
        dossierId: dossier.id,
        prestationId: req.body.prestationId || 1
      }));
      await PieceDossier.bulkCreate(pieces, { transaction: t });
    }

    await t.commit();

    const dossierComplet = await Dossier.findByPk(dossier.id, {
      include: [{ model: PieceDossier, as: 'piecesJointes' }]
    });

    res.status(201).json(dossierComplet);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message, stack: err.stack, errors: err.errors });
  }
});
// ✅ LISTE GÉNÉRALE (président + secrétariat)
router.get('/liste-generale', async (req, res) => {
  try {
    const { debut, fin } = req.query;

    let queryOptions = {
      order: [['createdAt', 'DESC']],
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

// ✅ SUPPRIMER (président + secrétariat)
router.delete('/:id',  async (req, res) => {
  try {
    await Dossier.destroy({ where: { id: req.params.id } });
    res.json({ message: "Dossier supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;