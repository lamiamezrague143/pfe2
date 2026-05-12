const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const { upload } = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");

// 🟢 GET MESSAGES — accessible par tous les connectés
router.get("/", authMiddleware(["agent", "beneficiaire","president"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const isAgent = req.user.role === "agent";

    const messages = await Message.findAll({
      where: isAgent
        ? {} // l'agent voit tout
        : {
            [require("sequelize").Op.or]: [
              { senderId: userId },
              { receiverId: userId },
            ],
          },
      order: [["createdAt", "ASC"]],
      include: [
        { model: User, as: "sender", attributes: ["id", "nomComplet"] },
      ],
    });

    res.json(messages);
  } catch (err) {
    console.error("❌ GET messages error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🟢 POST MESSAGE — accessible par tous les connectés
router.post("/", authMiddleware(["agent", "beneficiaire","president"]), upload.single("image"), async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    const message = await Message.create({
      senderId: req.user.id, // ✅ toujours depuis le token, jamais depuis le body
      receiverId: receiverId || 2,
      content: content || "",
      image: req.file?.path || null,
    });

    // ✅ Recharger avec le nom du sender
    const messageComplet = await Message.findByPk(message.id, {
      include: [
        { model: User, as: "sender", attributes: ["id", "nomComplet"] },
      ],
    });

    // ✅ Broadcaster via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("receive_message", messageComplet);
    }

    res.status(201).json(messageComplet);
  } catch (err) {
    console.error("❌ POST message error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;