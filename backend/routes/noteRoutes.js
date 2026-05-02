const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
//const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 🟢 GET ALL NOTES (agent + président)
router.get("/",  async (req, res) => {
  try {
    const notes = await Note.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.json(notes);

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🟢 CREATE NOTE (agent + président)
router.post("/",async (req, res) => {
  try {
    const { titre, contenu, agentNom } = req.body;

    const note = await Note.create({
      titre,
      contenu,
      agentNom
    });

    res.json(note);

  } catch (err) {
    res.status(500).json({ message: "Erreur création note" });
  }
});

// 🟢 UPDATE STATUT (agent + président)
router.put("/:id",  async (req, res) => {
  try {
    const { statut } = req.body;

    await Note.update(
      { statut },
      { where: { id: req.params.id } }
    );

    res.json({ message: "Statut mis à jour" });

  } catch (err) {
    res.status(500).json({ message: "Erreur update" });
  }
});

// 🟢 DELETE NOTE (agent + président)
router.delete("/:id",async (req, res) => {
  try {
    await Note.destroy({
      where: { id: req.params.id }
    });

    res.json({ message: "Supprimé" });

  } catch (err) {
    res.status(500).json({ message: "Erreur suppression" });
  }
});

module.exports = router;