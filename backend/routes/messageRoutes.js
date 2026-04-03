const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// ✅ GET : historique des messages
router.get("/", async (req, res) => {
  try {
    const messages = await Message.findAll({
      order: [["createdAt", "ASC"]],
    });

    res.json(messages);
  } catch (err) {
    console.error("❌ GET messages error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ POST : sauvegarder un message (API classique)
router.post("/", async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  if (!senderId || !content) {
    return res.status(400).json({
      message: "senderId et content sont obligatoires",
    });
  }

  try {
    const message = await Message.create({
      senderId,
      receiverId: receiverId || 0,
      content,
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("❌ POST message error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;