const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Prise = require("../models/Prise");
const bcrypt = require("bcryptjs");
const { upload } = require("../config/cloudinary");
const { Op, fn, col } = require("sequelize");

// =========================
// 1. REGISTER
// =========================
router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const photoUrl = req.file ? req.file.path : null;

    const { 
      nomComplet, 
      prenomComplet, 
      dateNaissance, 
      lieuNaissance, 
      sexe, 
      departement, 
      numero, 
      email, 
      positionAdministrative,
      categorieRole, 
      ayantDroits 
    } = req.body;

    // ✅ CORRECTION JSON.parse sécurisé
    let parsedAyantDroits = [];
    try {
      parsedAyantDroits = ayantDroits ? JSON.parse(ayantDroits) : [];
    } catch (e) {
      parsedAyantDroits = [];
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("PFE2026", salt);

    const newUser = await User.create({
      nomComplet,
      prenomComplet,
      dateNaissance, 
      lieuNaissance,
      sexe, 
      departement, 
      numero, 
      email,
      password: hashedPassword,
      positionAdministrative: positionAdministrative || "En activité",
      categorieRole: categorieRole || "Enseignant",
      photo: photoUrl,
      ayantDroits: parsedAyantDroits // ✅ FIX ICI
    });

    res.status(201).json({ 
      message: "Enseignant enregistré avec succès !", 
      user: newUser 
    });

  } catch (err) {
    console.error("Erreur d'enregistrement:", err);
    res.status(500).json({ 
      message: "Erreur serveur lors de l'inscription", 
      error: err.message 
    });
  }
});

// =========================
// 2. SEARCH
// =========================
router.get("/search", async (req, res) => {
  const { term } = req.query;
  try {
    const users = await User.findAll({
      where: {
        // On cherche dans le nom complet
        nomComplet: { [Op.like]: `%${term}%` } 
      },
      limit: 10
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});
// =========================
// 3. GET ALL
// =========================
router.get("/all", async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
});

// =========================
// 4. DELETE USER
// =========================
router.delete("/:id", async (req, res) => {
  try {
    const result = await User.destroy({
      where: { id: req.params.id }
    });

    if (result === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// =========================
// 5. UPDATE USER
// =========================
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.photo = req.file.path;
    }

    // ✅ sécuriser JSON.parse ici aussi
    if (updateData.ayantDroits) {
      try {
        updateData.ayantDroits = JSON.parse(updateData.ayantDroits);
      } catch (e) {
        updateData.ayantDroits = [];
      }
    }

    const [updated] = await User.update(updateData, {
      where: { id: req.params.id }
    });

    if (updated) {
      const updatedUser = await User.findByPk(req.params.id);
      return res.status(200).json({ 
        message: "Utilisateur mis à jour !", 
        user: updatedUser 
      });
    }

    return res.status(404).json({ message: "Utilisateur non trouvé" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur mise à jour", error: err.message });
  }
});

module.exports = router;