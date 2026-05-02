const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Prise = require("../models/Prise");
const bcrypt = require("bcryptjs");
const { upload } = require("../config/cloudinary");
const { Op, fn, col } = require("sequelize");
//const authMiddleware = require("../middleware/authMiddleware");
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
  ayantDroits,
  roleSystem
} = req.body;

    if (!nomComplet || !email) {
      return res.status(400).json({ message: "Le nom et l'email sont obligatoires" });
    }

    let parsedAyantDroits = [];
    if (ayantDroits) {
      try {
        parsedAyantDroits =
          typeof ayantDroits === "string"
            ? JSON.parse(ayantDroits)
            : ayantDroits;
      } catch {
        parsedAyantDroits = [];
      }
    }

    // 🔐 HASH PASSWORD (CORRIGÉ)
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
      ayantDroits: parsedAyantDroits,

      // 🔥 IMPORTANT POUR TON SYSTEME
      roleSystem: roleSystem || "beneficiaire",
      firstLogin: true
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: newUser
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur serveur",
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
  console.error("DEBUG d'erreur complète :", err); // Regarde l'objet err en entier
  res.status(500).json({ 
    message: "Erreur serveur interne", 
    error: err.name,
    details: err.errors ? err.errors.map(e => e.message) : err.message 
  });
}
});
// =========================
// 3. GET ALL
// =========================
router.get("/all",  async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
});
// 4. GET AYANTS DROIT  ← ICI, avant DELETE et PUT
// =========================
router.get("/ayants-droit/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user.ayantDroits || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// =========================
// 4. DELETE USER
// =========================
router.delete("/:id",  async (req, res) => {
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
// =========================
// 5. UPDATE USER (CORRIGÉ)
// =========================
router.put("/:id",  upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Si une nouvelle photo est téléchargée
    if (req.file) {
      updateData.photo = req.file.path;
    }

    // Gérer les ayant-droits sans faire planter le serveur
    if (updateData.ayantDroits) {
      try {
        // On ne fait JSON.parse que si c'est du texte brut (String)
        if (typeof updateData.ayantDroits === 'string') {
          updateData.ayantDroits = JSON.parse(updateData.ayantDroits);
        }
      } catch (e) {
        console.error("Problème avec le format des ayant-droits");
        // En cas d'erreur, on garde ce qu'on a ou on met un tableau vide
        updateData.ayantDroits = Array.isArray(updateData.ayantDroits) ? updateData.ayantDroits : [];
      }
    }

    // Lancement de la mise à jour dans la base de données
    const [updated] = await User.update(updateData, {
      where: { id: id }
    });

    if (updated) {
      const userMisAJour = await User.findByPk(id);
      return res.status(200).json({ message: "Succès !", user: userMisAJour });
    }

    res.status(404).json({ message: "Utilisateur non trouvé" });

  } catch (err) {
    // ICI : Regarde ton terminal Node.js, l'erreur s'affichera précisément
    console.error("ERREUR SERVEUR :", err); 
    res.status(500).json({ message: "Erreur technique", details: err.message });
  }
});
router.post("/change-password", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Body manquant (express.json absent ?)" });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Ancien mot de passe incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.firstLogin = false;

    await user.save();

    res.json({ message: "Mot de passe modifié avec succès" });

  } catch (err) {
    console.error("ERROR CHANGE PASSWORD:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});
router.get("/me",  async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
    attributes: ["id", "nomComplet", "email", "roleSystem"]
  });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
module.exports = router;