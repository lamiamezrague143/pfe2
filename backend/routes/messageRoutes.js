const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
// Supprime le require de multer ici s'il est déjà géré dans ta config Cloudinary
const { upload } = require("../config/cloudinary"); 

// ❌ SUPPRIME CETTE LIGNE (elle cause l'erreur) :
// const upload = multer({ storage: multer.memoryStorage() });

// GET messages
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

// POST message + image
// ✅ Ici, on utilise l' "upload" qui vient de Cloudinary
router.post("/", upload.single("image"), async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    const message = await Message.create({
      senderId,
      receiverId: receiverId || 0,
      content: content || "",
      image: req.file?.path || null, // URL retournée par Cloudinary
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("❌ POST message error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;