const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

// Models
const Demande = require('../models/Demande');
const Dossier = require('../models/Dossier');
const PieceDossier = require('../models/PieceDossier');

// Cloudinary (upload middleware)
const { upload } = require('../config/cloudinary');


// ─────────────────────────────
// 1. AJOUTER UNE DEMANDE
// ─────────────────────────────
router.post('/ajouter', (req, res) => {
  upload.array('pieces', 10)(req, res, async (err) => {

    if (err) {
      console.error("🔥 Upload error:", err);
      return res.status(500).json({
        message: "Erreur upload fichiers",
        error: err.message || err
      });
    }

    try {
      console.log("FILES:", req.files);
      console.log("BODY:", req.body);

      let piecesData = [];

      if (req.files && req.files.length > 0) {
        piecesData = req.files.map(file => ({
          nom: file.originalname,
          type: file.mimetype,
          data: file.path
        }));
      }

      const nouvelleDemande = await Demande.create({
        ...req.body,
        pieces: piecesData
      });

      res.status(201).json(nouvelleDemande);

    } catch (err) {
      console.error("🔥 Erreur Ajout Demande:", err);
      res.status(500).json({
        message: "Erreur serveur",
        error: err.message
      });
    }
  });
});


// ─────────────────────────────
// 2. VALIDER UNE DEMANDE (CORRIGÉ)
// ─────────────────────────────
router.post('/valider/:id', async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const demande = await Demande.findByPk(req.params.id, { transaction: t });

    if (!demande) {
      await t.rollback();
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Numéro unique
    const count = await Dossier.count();
    const num_sequence = `${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(3, '0')}`;

    // Création dossier
    const dossier = await Dossier.create({
      num_sequence,
      nom_beneficiaire: demande.nom_beneficiaire,
      type_prestation: demande.type_prestation,
      fonction: demande.fonction
    }, { transaction: t });

    // Transfert des pièces
    const pieces = Array.isArray(demande.pieces) ? demande.pieces : [];

    const formattedPieces = pieces.map(p => ({
      nom: p.nom,
      type: p.type || 'image/png',
      donnees: p.data,
      dossierId: dossier.id
    }));

    if (formattedPieces.length > 0) {
      await PieceDossier.bulkCreate(formattedPieces, { transaction: t });
    }

    // ✅ CORRECTION ICI (IMPORTANT)
demande.statut = "Validée";
await demande.save({ transaction: t });

    await t.commit();

    res.json({
      message: "Demande validée avec succès",
      dossier
    });

  } catch (err) {
    await t.rollback();
    console.error("🔥 Erreur validation:", err);

    res.status(500).json({
      message: "Erreur serveur",
      error: err.message
    });
  }
});


// ─────────────────────────────
// 3. RÉCUPÉRER DEMANDES
// ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const demandes = await Demande.findAll({
      attributes: [
        'id',
        'nom_beneficiaire',
        'sexe',
        'telephone',
        'type_prestation',
        'statut',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json(demandes);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur récupération",
      error: err.message
    });
  }
});


// ─────────────────────────────
// 4. REJETER UNE DEMANDE
// ─────────────────────────────
router.post('/rejeter/:id', async (req, res) => {
  try {
    const { motif } = req.body;

    const demande = await Demande.findByPk(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    demande.statut = "Rejetée";
    demande.motif_refus = motif || "Dossier non conforme";

    await demande.save();

    res.json({ message: "Demande rejetée avec succès" });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message
    });
  }
});


// ─────────────────────────────
// EXPORT
// ─────────────────────────────
module.exports = router;