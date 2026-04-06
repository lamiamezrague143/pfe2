const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

const Demande = require('../models/Demande');
const Dossier = require('../models/Dossier'); 
const PieceDossier = require('../models/PieceDossier'); 
const Prise = require('../models/Prise');
// ----------------------------------

// Upload Cloudinary
const { upload } = require('../config/cloudinary');


// ─────────────────────────────
// 1. AJOUT DEMANDE
// ─────────────────────────────
router.post('/ajouter', upload.array('ordonnance', 10), async (req, res) => {
  try {
    const { nom_beneficiaire, type_prestation, fonction, sexe, telephone, date_naissance } = req.body;

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
  userId: 1, // ⚠️ remplace par l'utilisateur connecté
  nom_beneficiaire,
  type_prestation,
  fonction,
  sexe,
  telephone,
  date_naissance,
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
// 2. VALIDER DEMANDE
// ─────────────────────────────
router.post('/valider/:id', async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const demande = await Demande.findByPk(req.params.id, { transaction: t });

    if (!demande) {
      await t.rollback();
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Numéro dossier
    const count = await Dossier.count({ transaction: t });

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

    // ✅ Gestion SAFE de pieces (IMPORTANT)
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

    // Transformation sécurisée
    const formattedPieces = pieces
      .filter(p => p && p.nom && p.data)
      .map(p => ({
        nom: p.nom,
        type: p.type || 'image/png',
        donnees: p.data,
        dossierId: dossier.id
      }));

    // Insertion en base
    if (formattedPieces.length > 0) {
      await PieceDossier.bulkCreate(formattedPieces, { transaction: t });
    }

    // Mise à jour statut
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
// 3. LISTE DEMANDES (SANS pièces) ✅
/*
💥 IMPORTANT : on ne récupère PAS `pieces`
→ évite l’erreur mémoire MySQL
*/
// ─────────────────────────────

router.get('/', async (req, res) => {
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
// 4. RÉCUPÉRER UNE DEMANDE (AVEC pièces)
// ─────────────────────────────
router.get('/:id', async (req, res) => {
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
// 5. REJETER DEMANDE
// ─────────────────────────────
router.post('/rejeter/:id', async (req, res) => {
  try {
    const { motif } = req.body;

    if (!motif || motif.trim() === "") {
      return res.status(400).json({
        message: "Le motif est obligatoire"
      });
    }

    const demande = await Demande.findByPk(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Mise à jour propre
    demande.message_admin = motif;
    demande.motif_refus = motif;
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
router.post('/submit-dossier', async (req, res) => {
  try {
    const { captchaInput, pNom, pPrenom, fonction, type_prestation, montantTotal } = req.body;

    // --- ÉTAPE 1 : LA BARRIÈRE CAPTCHA ---
    // On vérifie si le captcha existe et s'il correspond (en minuscule)
    if (!req.session.captcha || captchaInput.toLowerCase() !== req.session.captcha) {
      return res.status(400).json({ 
        success: false, 
        message: "Le code de sécurité est incorrect ou a expiré." 
      });
    }

    // --- ÉTAPE 2 : LOGIQUE MÉTIER (APRÈS VALIDATION) ---
    
    // Une fois validé, on supprime le captcha pour éviter qu'il soit réutilisé
    req.session.captcha = null;

    // Création de la demande dans MySQL via Sequelize
    const nouvelleDemande = await Prise.create({
      
  ref: "REF-" + Date.now(),
  sfEtablissement: 1, // à adapter
  agentNom: "Admin",  // ou req.user.nom

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
// ─────────────────────────────
// EXPORT
// ─────────────────────────────
module.exports = router;