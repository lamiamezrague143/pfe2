const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

const Demande = require('../models/Demande');
const Dossier = require('../models/Dossier'); 
const PieceDossier = require('../models/PieceDossier'); 
// ----------------------------------

// Upload Cloudinary
const { upload } = require('../config/cloudinary');


// ─────────────────────────────
// 1. AJOUT DEMANDE
// ─────────────────────────────

router.post('/ajouter', (req, res) => {
  // 1. On utilise bien 'ordonnance' ici (ce que tes logs confirment)
  upload.array('ordonnance', 10)(req, res, async (err) => {
    if (err) return res.status(500).json({ message: "Erreur upload", error: err.message });

    try {
      const { nom_beneficiaire, type_prestation, fonction, sexe, telephone, date_naissance } = req.body;

      // 2. On prépare les données pour la colonne JSON 'pieces' de ta BDD
      let piecesData = [];
      if (req.files && req.files.length > 0) {
        piecesData = req.files.map(file => ({
          nom: file.originalname,
          type: file.mimetype,
          data: file.path // L'URL Cloudinary (ex: https://res.cloudinary...)
        }));
      }

      // 3. Création dans la base de données
      const nouvelleDemande = await Demande.create({
        nom_beneficiaire,
        type_prestation,
        fonction,
        sexe,
        telephone,
        date_naissance,
        pieces: piecesData, // On enregistre le tableau d'objets ici
        statut: "En attente"
      });

      res.status(201).json(nouvelleDemande);

    } catch (err) {
      console.error("Erreur Sequelize:", err);
      res.status(500).json({ message: "Erreur enregistrement BDD", error: err.message });
    }
  });
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

    // Transfert pièces
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

    // Mise à jour statut
    demande.statut = "Validée";
    await demande.save({ transaction: t });

    await t.commit();

    res.json({
      message: "Demande validée",
      dossier
    });

  } catch (err) {
    await t.rollback();

    res.status(500).json({
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
    const demandes = await Demande.findAll({
      attributes: [
        'id',
        'nom_beneficiaire',
        'sexe',
        'telephone',
        'type_prestation',
        'statut',
        'motif_refus',
        'message_admin',
        'createdAt',
        'pieces' // ✅ RE-AJOUTE CE CHAMP ICI
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération", error: err.message });
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

    const demande = await Demande.findByPk(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: "Introuvable" });
    }

    // On enregistre le motif dans message_admin pour l'unifier avec la validation
    demande.message_admin = motif; 
    
    // Optionnel : garder aussi motif_refus si tu as une colonne dédiée
    demande.motif_refus = motif;

    await demande.save();

    res.json({ message: "Demande rejetée" });

  } catch (err) {
    res.status(500).json({
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
    const nouvelleDemande = await PriseEnCharge.create({
      pNom,
      pPrenom,
      fonction,
      type_prestation,
      montantTotal,
      statut: 'En attente'
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