const express = require("express");
const router = express.Router();
const { sequelize } = require("../config/db");
const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// --- AJOUTER CONVENTION (agent seulement)
router.post("/register", auth(["agent", "president"]), async (req, res) => {
  const { nom, type, adresse, telephone, email, services } = req.body;

  try {
    const [rows] = await sequelize.query("SELECT COUNT(*) as total FROM clinics");
    const count = rows[0].total;

    const prefix = nom.substring(0, 3).toUpperCase();
    const typeCode = type.substring(0, 1).toUpperCase();
    const numeroSequence = `${typeCode}${prefix}-${(count + 1).toString().padStart(3, '0')}`;

    const telephoneJSON = JSON.stringify(telephone || []);
    const servicesJSON = JSON.stringify(services || []);

    await sequelize.query(
      `INSERT INTO clinics 
      (nom, numeroSequence, type, adresse, telephone, email, services, dateAjout) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      {
        replacements: [
          nom,
          numeroSequence,
          type,
          adresse,
          telephoneJSON,
          email,
          servicesJSON,
        ]
      }
    );

    res.status(201).json({
      message: "Convention enregistrée !",
      numeroSequence
    });

  } catch (err) {
    console.error("Erreur MySQL:", err);
    res.status(500).json({ message: "Erreur lors de l'enregistrement." });
  }
});

// --- RÉCUPÉRER TOUTES LES CONVENTIONS (agent seulement)
router.get("/all", auth(["agent"]), async (req, res) => {
  try {
    const [rows] = await sequelize.query("SELECT * FROM clinics ORDER BY dateAjout DESC");

    const formattedClinics = rows.map(clinic => ({
      ...clinic,
      services: typeof clinic.services === 'string' ? JSON.parse(clinic.services) : clinic.services,
      telephone: typeof clinic.telephone === 'string' ? JSON.parse(clinic.telephone) : clinic.telephone
    }));

    res.json(formattedClinics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
});

// --- SUPPRIMER (agent seulement)
router.delete("/:id", auth(["agent"]), async (req, res) => {
  try {
    await sequelize.query("DELETE FROM clinics WHERE id = ?", {
      replacements: [req.params.id]
    });

    res.json({ message: "Convention supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
});

// --- MODIFIER (agent seulement)
router.put("/:id", auth(["agent"]), async (req, res) => {
  const { id } = req.params;
  const { nom, type, adresse, telephone, email, services } = req.body;

  try {
    const telephoneJSON = JSON.stringify(telephone || []);
    const servicesJSON = JSON.stringify(services || []);

    await sequelize.query(
      `UPDATE clinics 
       SET nom = ?, type = ?, adresse = ?, telephone = ?, email = ?, services = ?
       WHERE id = ?`,
      {
        replacements: [
          nom, 
          type, 
          adresse, 
          telephoneJSON, 
          email, 
          servicesJSON, 
          id
        ]
      }
    );

    res.json({ message: "Convention mise à jour avec succès !" });

  } catch (err) {
    console.error("Erreur MySQL lors de la modif:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour." });
  }
});

module.exports = router;