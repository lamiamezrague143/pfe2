const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const Demande = require('../models/Demande');
const Dossier = require('../models/Dossier'); 
const PieceDossier = require('../models/PieceDossier'); 
const Prise = require('../models/Prise');

// Upload Cloudinary
const upload = require('../middleware/upload');
// Middleware d'authentification
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// ─────────────────────────────
// 1. AJOUT DEMANDE (CLIENT / BÉNÉFICIAIRE)
// ─────────────────────────────
const Fichier = require('../models/Fichier');
router.post('/ajouter', authMiddleware(["beneficiaire","agent","president"]), upload.array('ordonnance', 10), async (req, res) => {
  try {
    const { nom_beneficiaire, type_prestation, fonction, sexe, telephone, date_naissance, lieu_naissance, etablissement, pour_qui, ayant_prenom, ayant_nom, ayant_lien, ayant_date_naiss, ayant_telephone } = req.body;

    // 1. Créer la demande d'abord
    const nouvelleDemande = await Demande.create({
      userId: req.user.id,
      nom_beneficiaire,
      type_prestation,
      fonction,
      sexe,
      telephone,
      date_naissance,
      lieu_naissance,
      etablissement,
      statut: "En attente",
      pour_qui: pour_qui || "moi",
      ayant_prenom: ayant_prenom || null,
      ayant_nom: ayant_nom || null,
      ayant_lien: ayant_lien || null,
      ayant_date_naiss: ayant_date_naiss || null,
      ayant_telephone: ayant_telephone || null,
    });

 // 2. Sauvegarder les fichiers dans la table fichiers
    if (req.files && req.files.length > 0) {
      const fichiersData = req.files.map(file => ({
        nom_original: file.originalname,
        nom_stockage: null,
        chemin: null,
        data: file.buffer.toString('base64'),
        mime_type: file.mimetype,
        taille: file.size,
        entite_type: 'prise_en_charge',
        entite_id: nouvelleDemande.id
      }));

      await Fichier.bulkCreate(fichiersData);
    }

    res.status(201).json(nouvelleDemande);

  } catch (err) {
    console.error("❌ ERREUR:", err);
    res.status(500).json({ message: "Erreur enregistrement BDD", error: err.message });
  }
});
// ─────────────────────────────
// 2. VALIDER DEMANDE (AGENT)
// ─────────────────────────────
router.post('/valider/:id', authMiddleware(["agent","president"]), async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const demande = await Demande.findByPk(req.params.id, { transaction: t });
    console.log("✅ DEMANDE TROUVÉE:", demande?.toJSON()); // ← ajoute ça
    console.log("✅ USER:", req.user); // ← et ça

    if (!demande) {
      await t.rollback();
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Numéro dossier
  // ✅ REMPLACE PAR CECI
const { Op } = require('sequelize');
const year = new Date().getFullYear();

const lastDossier = await Dossier.findOne({
  where: { num_sequence: { [Op.like]: `${year}-%` } },
  order: [['createdAt', 'DESC']],
  transaction: t
});

let nextNum = 1;
if (lastDossier) {
  const lastNum = parseInt(lastDossier.num_sequence.split('-')[1], 10);
  if (!isNaN(lastNum)) nextNum = lastNum + 1;
}

const num_sequence = `${year}-${nextNum.toString().padStart(3, '0')}`;
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
router.get('/', authMiddleware(["agent", "beneficiaire", "president"]), async (req, res) => {
  try {
    const isAgent = req.user.role === "agent" || req.user.role === "president";

    const demandes = await Demande.findAll({
      where: isAgent ? {} : { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const demandeIds = demandes.map(d => d.id);
    const fichiers = await Fichier.findAll({
      where: {
        entite_type: 'prise_en_charge',
        entite_id: { [Op.in]: demandeIds }
      }
    });

    const fichiersParDemande = {};
    fichiers.forEach(f => {
      if (!fichiersParDemande[f.entite_id]) fichiersParDemande[f.entite_id] = [];
      fichiersParDemande[f.entite_id].push({
        id: f.id,
        nom: f.nom_original,
        type: f.mime_type,
        data: `data:${f.mime_type};base64,${f.data}`
      });
    });

    const result = demandes.map(d => {
      const json = d.toJSON();
      json.pieces = fichiersParDemande[d.id] || [];
      return json;
    });

    res.json(result);

  } catch (err) {
    console.error("🔥 ERREUR GET DEMANDES:", err.message);
    res.status(500).json({ message: "Erreur récupération", error: err.message });
  }
});

// ─────────────────────────────
// 4. RÉCUPÉRER UNE DEMANDE AVEC PIÈCES (AGENT)
// ─────────────────────────────

// ─────────────────────────────
// 5. REJETER DEMANDE (AGENT)
// ─────────────────────────────
router.post('/rejeter/:id', authMiddleware(["agent","president"]), async (req, res) => {
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
// 7. UPLOAD PRISE EN CHARGE (AGENT → vers bénéficiaire)
// ─────────────────────────────
router.post('/upload-pec/:id', authMiddleware(["agent", "president"]), upload.single('pec'), async (req, res) => {
  try {
    const demande = await Demande.findByPk(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier reçu" });
    }

    // Cloudinary renvoie le lien public dans req.file.path
demande.fichier_prise_en_charge = `uploads/ordonnances/${req.file.filename}`;
    if (req.body.note && req.body.note.trim()) {
      demande.message_admin = req.body.note.trim();
    }

    await demande.save();

    return res.json({
      message: "✅ Prise en charge uploadée avec succès",
      fichier: req.file.path
    });

  } catch (err) {
    console.error("🔥 ERREUR UPLOAD PEC MESSAGE:", err.message);
    console.error("🔥 STACK:", err.stack);
    console.error("🔥 FILE RECU:", req.file);
    console.error("🔥 BODY RECU:", req.body);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});
module.exports = router;