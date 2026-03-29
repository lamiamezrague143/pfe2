const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

// Import des modèles
const Demande = require('../models/Demande');
const Dossier = require('../models/Dossier');
const PieceDossier = require('../models/PieceDossier');

// Import du middleware Multer
const upload = require('../middleware/upload'); 

// ─── 1. AJOUTER UNE DEMANDE (CORRIGÉ POUR LE FRONTEND) ───────────────────────
// Utilisation de upload.array('pieces') pour correspondre à fd.append("pieces", f)
router.post('/ajouter', upload.array('pieces', 10), async (req, res) => {
  try {
    const { nom_beneficiaire, type_prestation, fonction } = req.body;

    // Validation de base
    if (!nom_beneficiaire || !type_prestation) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Extraction des noms de fichiers (tableau de strings)
    // req.files est un tableau d'objets généré par upload.array
    const nomsFichiers = req.files ? req.files.map(f => f.filename) : [];

    const demande = await Demande.create({
      nom_beneficiaire,
      type_prestation,
      fonction: fonction || "Personnel",
      // Stockage direct du tableau de noms de fichiers dans la colonne JSON
      pieces: nomsFichiers, 
      statut: "En attente"
    });

    res.status(201).json(demande);
  } catch (err) {
    console.error("Erreur Backend Ajout avec fichiers:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. VALIDER DEMANDE (TRANSFERT VERS DOSSIER) ─────────────────────────────
router.post('/valider/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const demande = await Demande.findByPk(req.params.id);
    if (!demande) {
      await t.rollback();
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Génération du numéro de séquence (Ex: 2026-001)
    const count = await Dossier.count();
    const num_sequence = `${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    // Création du Dossier définitif
    const dossier = await Dossier.create({
      num_sequence,
      nom_beneficiaire: demande.nom_beneficiaire,
      type_prestation: demande.type_prestation,
      fonction: demande.fonction
    }, { transaction: t });

    // Transfert des pièces jointes vers la table PieceDossier
    if (demande.pieces && Array.isArray(demande.pieces)) {
      const piecesData = demande.pieces.map(nomFichier => ({
        nom: nomFichier,
        dossierId: dossier.id
      }));
      
      if (piecesData.length > 0) {
        await PieceDossier.bulkCreate(piecesData, { transaction: t });
      }
    }

    // Mise à jour du statut de la demande
    demande.statut = "Validée";
    await demande.save({ transaction: t });

    await t.commit();
    res.json({ message: "Demande validée et Dossier créé", dossier });
  } catch (err) {
    if (t) await t.rollback();
    console.error("Erreur Validation:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. RÉCUPÉRER TOUTES LES DEMANDES ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const demandes = await Demande.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(demandes);
  } catch (err) {
    console.error("Erreur Récupération demandes:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. REJETER UNE DEMANDE ──────────────────────────────────────────────────
router.post('/rejeter/:id', async (req, res) => {
  try {
    const { motif } = req.body;
    const demande = await Demande.findByPk(req.params.id);
    
    if (!demande) return res.status(404).json({ message: "Demande introuvable" });

    demande.statut = "Rejetée";
    demande.motif_refus = motif || "Dossier incomplet ou non conforme";
    await demande.save();

    res.json({ message: "Demande refusée avec motif" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;