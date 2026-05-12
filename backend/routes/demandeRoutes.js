const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

const Demande = require('../models/Demande');
const Dossier = require('../models/Dossier'); 
const PieceDossier = require('../models/PieceDossier'); 
const Prise = require('../models/Prise');

// Upload Cloudinary
const { upload } = require('../config/cloudinary');

// Middleware d'authentification
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// ─────────────────────────────
// 1. AJOUT DEMANDE (CLIENT / BÉNÉFICIAIRE)
// ─────────────────────────────
router.post('/ajouter', authMiddleware(["beneficiaire","agent","president"]),upload.array('ordonnance', 10), async (req, res) => {
  try {
    const { nom_beneficiaire, type_prestation, fonction, sexe, telephone, date_naissance, lieu_naissance, etablissement } = req.body;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    let piecesData = [];

    if (req.files && req.files.length > 0) {
      piecesData = req.files.map(file => ({
        nom: file.originalname,
        type: file.mimetype,
        data: file.path
      }));
    }

    const nouvelleDemande = await Demande.create({
      userId: req.user.id, // ⚠️ remplace par l'utilisateur connecté (bénéficiaire)
      nom_beneficiaire,
      type_prestation,
      fonction,
      sexe,
      telephone,
      date_naissance,
      lieu_naissance,
      etablissement,
      pieces: piecesData,
      statut: "En attente"
    });

    res.status(201).json(nouvelleDemande);

  } catch (err) {
    console.error("❌ ERREUR:", err);
    res.status(500).json({
      message: "Erreur enregistrement BDD",
      error: err.message
    });
  }
});

// ─────────────────────────────
// 2. VALIDER DEMANDE (AGENT)
// ─────────────────────────────
router.post('/valider/:id', authMiddleware(["agent","president"]), async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const demande = await Demande.findByPk(req.params.id, { transaction: t });

    if (!demande) {
      await t.rollback();
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Numéro dossier
    const count = await Dossier.count({ transaction: t });
    const num_sequence = `${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    // Création dossier
    const dossier = await Dossier.create({
      num_sequence,
      nom_beneficiaire: demande.nom_beneficiaire,
      type_prestation: demande.type_prestation,
      fonction: demande.fonction
    }, { transaction: t });

    // Gestion SAFE des pieces
    let pieces = [];

    try {
      if (typeof demande.pieces === "string") {
        pieces = JSON.parse(demande.pieces);
      } else if (Array.isArray(demande.pieces)) {
        pieces = demande.pieces;
      }
    } catch (e) {
      console.error("❌ Erreur parsing pieces:", e);
      pieces = [];
    }

    const formattedPieces = pieces
      .filter(p => p && p.nom && p.data)
      .map(p => ({
        nom: p.nom,
        type: p.type || 'image/png',
        donnees: p.data,
        dossierId: dossier.id
      }));

    if (formattedPieces.length > 0) {
      await PieceDossier.bulkCreate(formattedPieces, { transaction: t });
    }

    demande.statut = "Validée";
    await demande.save({ transaction: t });

    await t.commit();

    return res.json({
      message: "Demande validée",
      dossier
    });

  } catch (err) {
    await t.rollback();
    console.error("🔥 ERREUR VALIDER:", err);
    return res.status(500).json({
      message: "Erreur serveur",
      error: err.message
    });
  }
});

// ─────────────────────────────
// 3. LISTE DEMANDES (AGENT)
// ─────────────────────────────
router.get('/', authMiddleware(["agent", "beneficiaire","president"]), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const demandes = await Demande.findAll({
      attributes: [
        'id',
        'nom_beneficiaire',
        'sexe',
        'telephone',
        'type_prestation',
        'statut',
        'createdAt',
        'pieces',
        [sequelize.literal('JSON_LENGTH(pieces)'), 'nb_pieces']
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json(demandes);

  } catch (err) {
    res.status(500).json({
      message: "Erreur récupération",
      error: err.message
    });
  }
});

// ─────────────────────────────
// 4. RÉCUPÉRER UNE DEMANDE AVEC PIÈCES (AGENT)
// ─────────────────────────────
router.get('/:id', authMiddleware(["agent","president"]), async (req, res) => {
  try {
    const demande = await Demande.findByPk(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: "Introuvable" });
    }

    res.json(demande);

  } catch (err) {
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message
    });
  }
});

// ─────────────────────────────
// 5. REJETER DEMANDE (AGENT)
// ─────────────────────────────
router.post('/rejeter/:id', authMiddleware(["agent",,"president"]), async (req, res) => {
  try {
   const { motif_refus, motif } = req.body;
const motifFinal = motif_refus || motif;
if (!motifFinal || motifFinal.trim() === "") {
      return res.status(400).json({
        message: "Le motif est obligatoire"
      });
    }

    const demande = await Demande.findByPk(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

demande.message_admin = motifFinal;
demande.motif_refus = motifFinal;
    demande.statut = "Rejetée";

    await demande.save();

    return res.json({
      message: "Demande rejetée avec succès"
    });

  } catch (err) {
    console.error("🔥 ERREUR REJET:", err);
    return res.status(500).json({
      message: "Erreur serveur",
      error: err.message
    });
  }
});

// ─────────────────────────────
// 6. SUBMIT DOSSIER (AGENT)
// ─────────────────────────────
router.post('/submit-dossier', authMiddleware(["agent","president"]), async (req, res) => {
  try {
    const { captchaInput, pNom, pPrenom, fonction, type_prestation, montantTotal } = req.body;

    // Vérification captcha
    if (!req.session.captcha || captchaInput.toLowerCase() !== req.session.captcha) {
      return res.status(400).json({ 
        success: false, 
        message: "Le code de sécurité est incorrect ou a expiré." 
      });
    }

    req.session.captcha = null;

    const nouvelleDemande = await Prise.create({
      ref: "REF-" + Date.now(),
      sfEtablissement: 1,
      agentNom: req.user?.nom || "Admin",
      pNom,
      pPrenom,
      fonction,
      type_prestation,
      montantTotal,
      statut: 'Active'
    });

    res.status(201).json({
      success: true,
      message: "Demande enregistrée avec succès !",
      data: nouvelleDemande
    });

  } catch (error) {
    console.error("Erreur soumission:", error);
    res.status(500).json({ success: false, message: "Erreur interne du serveur." });
  }
});

module.exports = router;