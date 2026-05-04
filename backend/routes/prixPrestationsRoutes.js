const express = require("express");
const router = express.Router();

const PrixPrestations = require("../models/PrixPrestations");
const TypesPrestations = require("../models/TypesPrestations");
const Clinique = require("../models/Clinique");

// ➕ ajouter prix
router.post("/", async (req, res) => {
  try {
    const { cliniqueId, prix, prix_reduit } = req.body;

    const newPrix = await PrixPrestations.create({
      cliniqueId,
      prix,
      prix_reduit,
    });

    res.status(201).json(newPrix);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// 🔍 prix par clinique
router.get("/clinique/:id", async (req, res) => {
  try {
    const data = await PrixPrestations.findAll({
      where: { cliniqueId: req.params.id },
      attributes: ["id", "cliniqueId", "prix", "nom"],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ✏️ update
router.put("/:id", async (req, res) => {
  try {
    const { prix, prix_reduit } = req.body;

    await PrixPrestations.update(
      { prix, prix_reduit },
      { where: { id: req.params.id } }
    );

    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ❌ delete
router.delete("/:id", async (req, res) => {
  try {
    await PrixPrestations.destroy({
      where: { id: req.params.id },
    });

    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;