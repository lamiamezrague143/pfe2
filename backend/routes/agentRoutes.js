const express = require("express");
const router = express.Router();
const Agent = require("../models/Agent");
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 📥 GET ALL (président uniquement)
router.get("/", authMiddleware(["president"]), async (req, res) => {
  try {
    const agents = await Agent.findAll();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📥 GET BY ID (président uniquement)
router.get("/:id", authMiddleware(["president"]), async (req, res) => {
  try {
    const agent = await Agent.findByPk(req.params.id);
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ CREATE (président uniquement)
router.post("/", authMiddleware(["president"]), async (req, res) => {
  try {
    const agent = await Agent.create(req.body);
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ UPDATE (président uniquement)
router.put("/:id", authMiddleware(["president"]), async (req, res) => {
  try {
    await Agent.update(
      { nom: req.body.nom },
      { where: { id: req.params.id } }
    );

    res.json({ message: "Agent modifié" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ DELETE (président uniquement)
router.delete("/:id", authMiddleware(["president"]), async (req, res) => {
  try {
    await Agent.destroy({
      where: { id: req.params.id }
    });

    res.json({ message: "Agent supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;