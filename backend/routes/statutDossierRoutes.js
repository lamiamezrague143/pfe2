// routes/statutDossierRoutes.js
const express = require("express");
const router  = express.Router();


const authMiddleware = require("../middleware/authMiddleware");
// REMPLACE les 2 lignes en haut du fichier
const { StatutDossier, User } = require("../models"); // ← depuis index.js
// ──────────────────────────────────────────────────────────────
// 1. SECRÉTARIAT — Créer un dossier
// POST /api/statut-dossiers
// ──────────────────────────────────────────────────────────────
router.post("/", authMiddleware(["secretariat","president"]), async (req, res) => {
  try {
    const { userId, typePret, dossierRef, statut, motifRefus, commentaire, dateDepot } = req.body;

    if (!userId || !typePret) {
      return res.status(400).json({ message: "userId et typePret sont obligatoires" });
    }

    if (statut === "refuse" && !motifRefus) {
      return res.status(400).json({ message: "Le motif de refus est obligatoire" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Bénéficiaire introuvable" });

    const dossier = await StatutDossier.create({
      userId,
      typePret,
      dossierRef:  dossierRef  || null,
      statut:      statut      || "en_attente",
      motifRefus:  statut === "refuse" ? motifRefus : null,
      commentaire: commentaire || null,
      dateDepot:   dateDepot   || new Date(),
      updatedBy:   req.user?.nom || "Secrétariat",
    });

    res.status(201).json({ message: "Dossier créé", dossier });
  } catch (err) {
    console.error("❌ POST /statut-dossiers :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 2. SECRÉTARIAT — Tous les dossiers
// GET /api/statut-dossiers
// ──────────────────────────────────────────────────────────────
router.get("/", authMiddleware(["secretariat","president"]), async (req, res) => {
  try {
    const dossiers = await StatutDossier.findAll({
      include: [{
        model: User,
        attributes: ["id", "nomComplet", "prenomComplet", "email", "roleSystem", "departement"],
      }],
      order: [["createdAt", "DESC"]],
    });
    res.json(dossiers);
  } catch (err) {
    console.error("❌ GET /statut-dossiers :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 3. BÉNÉFICIAIRE — Ses propres dossiers
// GET /api/statut-dossiers/mes-dossiers
// ──────────────────────────────────────────────────────────────
router.get("/mes-dossiers", authMiddleware(["secretariat","president","beneficiaire"]), async (req, res) => {
  try {
    const dossiers = await StatutDossier.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(dossiers);
  } catch (err) {
    console.error("❌ GET /mes-dossiers :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 4. SECRÉTARIAT — Modifier un dossier
// PUT /api/statut-dossiers/:id
// ──────────────────────────────────────────────────────────────
router.put("/:id", authMiddleware(["secretariat","president"]), async (req, res) => {
  try {
    const { statut, motifRefus, commentaire } = req.body;

    if (statut === "refuse" && !motifRefus) {
      return res.status(400).json({ message: "Le motif de refus est obligatoire" });
    }

    const dossier = await StatutDossier.findByPk(req.params.id);
    if (!dossier) return res.status(404).json({ message: "Dossier introuvable" });

    await dossier.update({
      statut,
      motifRefus:  statut === "refuse" ? motifRefus : null,
      commentaire: commentaire || dossier.commentaire,
      updatedBy:   req.user?.nom || "Secrétariat",
    });

    res.json({ message: "Statut mis à jour", dossier });
  } catch (err) {
    console.error("❌ PUT /statut-dossiers/:id :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 5. SECRÉTARIAT — Supprimer un dossier
// DELETE /api/statut-dossiers/:id
// ──────────────────────────────────────────────────────────────
router.delete("/:id", authMiddleware(["secretariat","president"]), async (req, res) => {
  try {
    const result = await StatutDossier.destroy({ where: { id: req.params.id } });
    if (!result) return res.status(404).json({ message: "Dossier introuvable" });
    res.json({ message: "Dossier supprimé" });
  } catch (err) {
    console.error("❌ DELETE /statut-dossiers/:id :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;