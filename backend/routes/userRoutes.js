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
// ✅ upload.any() accepte photo + ayantDroitPhoto_0, ayantDroitPhoto_1...
router.post("/register", upload.any(), async (req, res) => {
  try {
    const files = req.files;

    // Photo principale
    const photoFile = files.find(f => f.fieldname === "photo");
    const photoUrl = photoFile ? photoFile.path : null;

    // Parser les ayants droit
    let parsedAyantDroits = [];
    if (req.body.ayantDroits) {
      try {
        parsedAyantDroits = JSON.parse(req.body.ayantDroits);
      } catch (e) { parsedAyantDroits = []; }
    }

    // ✅ Associer chaque photo Cloudinary à son ayant droit
    const ayantDroitPhotos = files.filter(f => f.fieldname.startsWith("ayantDroitPhoto_"));
    ayantDroitPhotos.forEach(file => {
      const index = parseInt(file.fieldname.replace("ayantDroitPhoto_", ""));
      if (parsedAyantDroits[index]) {
        parsedAyantDroits[index].photo = file.path; // ✅ URL Cloudinary
      }
    });

    const { nomComplet, prenomComplet, dateNaissance, lieuNaissance,
            sexe, departement, numero, email, positionAdministrative, categorieRole } = req.body;

    if (!nomComplet || !email) {
      return res.status(400).json({ message: "Le nom et l'email sont obligatoires" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("PFE2026", salt);

    const newUser = await User.create({
      nomComplet, prenomComplet, dateNaissance, lieuNaissance,
      sexe, departement, numero, email,
      password: hashedPassword,
      positionAdministrative: positionAdministrative || "En activité",
      categorieRole: categorieRole || "Enseignant",
      photo: photoUrl,
      ayantDroits: parsedAyantDroits // ✅ avec les URLs Cloudinary
    });

    res.status(201).json({ message: "Enregistré avec succès !", user: newUser });

  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Cet email ou numéro est déjà utilisé." });
    }
    console.error("Erreur:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ✅ Même correction pour PUT
router.put("/:id", upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const updateData = { ...req.body };

    // Photo principale
    const photoFile = files.find(f => f.fieldname === "photo");
    if (photoFile) updateData.photo = photoFile.path;

    // Parser les ayants droit
    let parsedAyantDroits = [];
    if (updateData.ayantDroits) {
      try {
        parsedAyantDroits = typeof updateData.ayantDroits === 'string'
          ? JSON.parse(updateData.ayantDroits)
          : updateData.ayantDroits;
      } catch (e) { parsedAyantDroits = []; }
    }

    // ✅ Associer photos Cloudinary aux ayants droit
    const ayantDroitPhotos = files.filter(f => f.fieldname.startsWith("ayantDroitPhoto_"));
    ayantDroitPhotos.forEach(file => {
      const index = parseInt(file.fieldname.replace("ayantDroitPhoto_", ""));
      if (parsedAyantDroits[index]) {
        parsedAyantDroits[index].photo = file.path;
      }
    });

    updateData.ayantDroits = parsedAyantDroits;

    const [updated] = await User.update(updateData, { where: { id } });

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
router.get("/all", async (req, res) => {
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
// =========================
// 5. UPDATE USER (CORRIGÉ)
// =========================

module.exports = router;