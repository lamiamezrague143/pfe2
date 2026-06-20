const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const upload = require('../middleware/upload');
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
    // Dans GET "/" et POST "/" — les deux endroits
include: [
  { model: User, as: "sender", attributes: ["id", "nomComplet", "prenomComplet"] },
],
    });

    res.json(messages);
  } catch (err) {
    console.error("❌ GET messages error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🟢 POST MESSAGE — accessible par tous les connectés
const Fichier = require("../models/Fichier");
// 🟢 POST MESSAGE
router.post("/", authMiddleware(["agent", "beneficiaire", "president"]), upload.single("image"), async (req, res) => {  const { receiverId, content, contentForSender } = req.body;
  try {
    const message = await Message.create({
      senderId: req.user.id,
      receiverId: receiverId || 2,
      content: content || "",
      contentForSender: contentForSender || null,
    });

    // ✅ Si une image a été envoyée, on la stocke en BDD via Fichier
    let fichierId = null;
    if (req.file) {
      const fichier = await Fichier.create({
        nom_original: req.file.originalname,
        data: req.file.buffer.toString("base64"),
        mime_type: req.file.mimetype,
        taille: req.file.size,
        entite_type: "message",
        entite_id: message.id,
      });
      fichierId = fichier.id;
      await message.update({ image: fichierId }); // on stocke l'id du fichier dans la colonne "image"
    }

    const messageComplet = await Message.findByPk(message.id, {
      include: [
        { model: User, as: "sender", attributes: ["id", "nomComplet", "prenomComplet"] },
      ],
    });

    const io = req.app.get("io");
    if (io) {
      const senderId   = String(req.user.id);
      const receiverIdStr = String(message.receiverId);
      io.to(`user:${senderId}`).emit("receive_message", messageComplet);
      io.to(`user:${receiverIdStr}`).emit("receive_message", messageComplet);
    }

    res.status(201).json(messageComplet);
  } catch (err) {
    console.error("❌ POST message error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// 🔴 DELETE MESSAGE — supprimer un message
router.delete(
  "/:id",
  authMiddleware(["agent", "beneficiaire", "president"]),
  async (req, res) => {
    try {
      const message = await Message.findByPk(req.params.id);

      // ✅ Vérifier si le message existe
      if (!message) {
        return res.status(404).json({
          message: "Message introuvable",
        });
      }

      // ✅ Sécurité :
      // - l'agent peut supprimer tous les messages
      // - sinon seulement l'expéditeur du message
      if (
        req.user.role !== "agent" &&
        message.senderId !== req.user.id
      ) {
        return res.status(403).json({
          message: "Non autorisé",
        });
      }

      // ✅ Supprimer le message
      await message.destroy();

      // ✅ Informer les sockets
      const io = req.app.get("io");
      if (io) {
        io.emit("message_deleted", {
          id: message.id,
        });
      }

      res.json({
        message: "Message supprimé avec succès",
      });
    } catch (err) {
      console.error("❌ DELETE message error:", err);
      res.status(500).json({
        message: "Erreur serveur",
      });
    }
  }
);
module.exports = router;