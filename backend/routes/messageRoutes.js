const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { upload } = require("../config/cloudinary");
const auth = require("../middleware/authMiddleware"); // 🔐 IMPORTANT

// 🟢 GET MESSAGES (agent + président)
router.get("/", auth(["agent", "president"]), async (req, res) => {
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

// 🟢 POST MESSAGE (agent + président)
router.post("/", auth(["agent", "president"]), upload.single("image"), async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    const message = await Message.create({
      senderId,
      receiverId: receiverId || 0,
      content: content || "",
      image: req.file?.path || null,
    });

    res.status(201).json(message);

  } catch (err) {
    console.error("❌ POST message error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;