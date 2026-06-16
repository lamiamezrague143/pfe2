const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Prise = require("../models/Prise");
const bcrypt = require("bcryptjs");
const { upload } = require("../config/cloudinary");
const { Op, fn, col } = require("sequelize");
const authMiddleware = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const loginLimiter = require("../middleware/rateLimiter");
const { validateLogin } = require("../middleware/validate");
const { generateKeyPair } = require('../utils/crypto');

// =========================
// ROUTES PUBLIQUES (tout le monde peut y accéder)
// =========================

// Login - public
router.post("/login", loginLimiter, validateLogin,async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe obligatoires" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    console.log("BODY :", req.body);
console.log("USER :", user);
console.log("PASSWORD BDD :", user.password);

const isMatch = await bcrypt.compare(password, user.password);

console.log("MATCH :", isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.roleSystem,
        nom: user.nomComplet,
        prenom: user.prenomComplet
      },
       process.env.JWT_SECRET,
      { expiresIn: "15m"}
    );
    // Refresh token - 7 jours
const refreshToken = jwt.sign(
  { id: user.id },
  process.env.JWT_REFRESH_SECRET || "REFRESH_SECRET_PFE_2026",
  { expiresIn: "7d" }
);

// Stocker le refresh token dans un cookie HttpOnly
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,       // inaccessible au JS → sécurisé
  sameSite: "strict",
  secure: false,        // true en production HTTPS
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
});


    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        nom: user.nomComplet,
        email: user.email,
        role: user.roleSystem,
        firstLogin: user.firstLogin
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Register - public (inscription)
router.post("/register", authMiddleware(["agent", "president"]), upload.single("photo"), async (req, res) => {
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
        parsedAyantDroits = typeof ayantDroits === "string" ? JSON.parse(ayantDroits) : ayantDroits;
      } catch {
        parsedAyantDroits = [];
      }
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
      ayantDroits: parsedAyantDroits,
      roleSystem: roleSystem || "beneficiaire",
      firstLogin: true
    });

    res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// =========================
// ROUTES PROTÉGÉES (agents ET présidents uniquement)
// =========================

// 1. Recherche d'utilisateurs
router.get("/search", authMiddleware(["agent", "president","secretariat","comptable"]), async (req, res) => {
  const { term } = req.query;
  try {
    const users = await User.findAll({
      where: {
        nomComplet: { [Op.like]: `%${term}%` }
      },
      limit: 10
    });
    res.json(users);
  } catch (err) {
    console.error("DEBUG d'erreur complète :", err);
    res.status(500).json({
      message: "Erreur serveur interne",
      error: err.name,
      details: err.errors ? err.errors.map(e => e.message) : err.message
    });
  }
});

// 2. Récupérer tous les utilisateurs
router.get("/all", authMiddleware(["agent", "president","secretariat","comptable"]), async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
});

// 3. Récupérer les ayant-droits d'un utilisateur
router.get("/ayants-droit/:id", authMiddleware(["agent", "president"]), async (req, res) => {
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

// 4. Supprimer un utilisateur
router.delete("/:id", authMiddleware(["agent", "president"]), async (req, res) => {
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

// 5. Modifier un utilisateur
router.put("/:id", authMiddleware(["agent", "president","secretariat","comptable"]), upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.photo = req.file.path;
    }

    if (updateData.ayantDroits) {
      try {
        if (typeof updateData.ayantDroits === 'string') {
          updateData.ayantDroits = JSON.parse(updateData.ayantDroits);
        }
      } catch (e) {
        console.error("Problème avec le format des ayant-droits");
        updateData.ayantDroits = Array.isArray(updateData.ayantDroits) ? updateData.ayantDroits : [];
      }
    }

    const [updated] = await User.update(updateData, {
      where: { id: id }
    });

    if (updated) {
      const userMisAJour = await User.findByPk(id);
      return res.status(200).json({ message: "Succès !", user: userMisAJour });
    }

    res.status(404).json({ message: "Utilisateur non trouvé" });
  } catch (err) {
    console.error("ERREUR SERVEUR :", err);
    res.status(500).json({ message: "Erreur technique", details: err.message });
  }
});

// 6. Changer le mot de passe (nécessite d'être connecté)
router.post("/change-password", authMiddleware([]), async (req, res) => {
  try {
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
// routes/userRoutes.js
router.post("/reset-password/:id", authMiddleware(["secretariat", "president"]), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Génère un mot de passe lisible
    const newPassword = `COS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    user.password          = await bcrypt.hash(newPassword, 10);
    user.generatedPassword = newPassword;   // ← stocke en clair pour l'afficher
    await user.save();

    res.json({ generatedPassword: newPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// 7. Récupérer son propre profil
router.get("/me", authMiddleware(["agent", "president","comptable","secretariat","ingenieur","beneficiaire"]), async (req, res) => {
  try {
    console.log("REQ USER:", req.user);

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (err) {
    console.error("ERROR /me:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});
// Renouveler l'access token
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token manquant" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "REFRESH_SECRET_PFE_2026");

    // Récupère le user depuis la DB pour avoir nom + prenom
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const newToken = jwt.sign(
      {
        id: user.id,
        role: user.roleSystem,
        nom: user.nomComplet,
        prenom: user.prenomComplet   // ← ajouté
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ token: newToken });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token invalide" });
  }
});

// Colonne à ajouter dans ta table users :
// ALTER TABLE users ADD COLUMN publicKey TEXT NULL;


// GET /api/users/public-key/:userId — récupérer la clé publique d'un utilisateur

// ✅ POST — enregistrer sa clé publique
router.post("/public-key", authMiddleware(["agent", "beneficiaire", "secretariat", "president"]), async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) return res.status(400).json({ message: "Clé publique manquante." });

    await User.update({ publicKey }, { where: { id: req.user.id } });
    res.json({ message: "Clé publique enregistrée." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// ✅ GET — récupérer la clé publique + générer si absente
router.get('/public-key/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user)
      return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // Régénère si l'une des deux clés manque
    if (!user.publicKey || !user.privateKey) {
      const { publicKey, privateKey } = generateKeyPair();
      await user.update({ publicKey, privateKey });
      await user.reload();
    }

    res.json({ publicKey: user.publicKey });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
  res.json({ message: "Déconnecté avec succès" });
});
// routes/users.js
router.get("/admin-key", async (req, res) => {
  try {
    // Trouver un utilisateur admin/agent disponible
    const admin = await User.findOne({
      where: { role: ["president", "agent", "beneficiaire"] }, // adapte selon tes rôles
    });

    if (!admin) return res.status(404).json({ message: "Aucun admin trouvé" });

    res.json({
      adminId: admin.id,
      publicKey: admin.publicKey, // ✅ retourner la clé publique
    });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});
module.exports = router;