const express = require("express");
const router = express.Router();
const { sequelize } = require("../config/db");

// --- AJOUTER CONVENTION ---
router.post("/register", async (req, res) => {
  const { nom, type, adresse, telephone, email, services } = req.body;

  try {
    // Récupérer le compte pour le numéro de séquence
    const [rows] = await sequelize.query("SELECT COUNT(*) as total FROM clinics");
    const count = rows[0].total;

    // Génération du numéro (Ex: CPFE-001)
    const prefix = nom.substring(0, 3).toUpperCase();
    const typeCode = type.substring(0, 1).toUpperCase();
    const numeroSequence = `${typeCode}${prefix}-${(count + 1).toString().padStart(3, '0')}`;

    // 🔥 CRUCIAL : On transforme les tableaux en chaînes JSON pour MySQL
    const telephoneJSON = JSON.stringify(telephone || []);
    const servicesJSON = JSON.stringify(services || []);

    // Insertion (8 colonnes -> 8 valeurs)
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
          telephoneJSON, // Utilisation de la version JSON
          email,
          servicesJSON,  // Utilisation de la version JSON
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

// --- RÉCUPÉRER TOUTES LES CONVENTIONS ---
router.get("/all", async (req, res) => {
  try {
    const [rows] = await sequelize.query("SELECT * FROM clinics ORDER BY dateAjout DESC");

    // On s'assure que le frontend reçoit des objets JS propres
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

// --- SUPPRIMER UNE CONVENTION ---
router.delete("/:id", async (req, res) => {
  try {
    await sequelize.query("DELETE FROM clinics WHERE id = ?", {
      replacements: [req.params.id]
    });
    res.json({ message: "Convention supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
});
// --- MODIFIER UNE CONVENTION ---
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nom, type, adresse, telephone, email, services } = req.body;

  try {
    // 🔥 Comme pour l'insertion, on transforme les tableaux en JSON pour MySQL
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