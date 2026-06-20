
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
const helmet = require("helmet");
const { Server } = require("socket.io");
const app = express();
const jwt = require("jsonwebtoken");
app.use(helmet()); // ← AJOUTE
require("./models/association");
// ✅ AJOUT IMPORTANT ICI


const server = http.createServer(app);


// --- DB & Modèles ---
const { sequelize } = require("./config/db");
const { User, Prise } = require("./models"); 
const Setting = require("./models/Setting"); 
const Message = require("./models/Message");
// --- CORRECTION ICI : Utilisez ./ car server.js est au même niveau que le dossier models ---
const Etat = require('./models/Etat');
const LigneEtat = require('./models/LigneEtat');
const PasswordResetOtp = require('./models/PasswordResetOtp'); 
// --- Import des Routes ---
const priseRoutes = require("./routes/priseRoutes");
const userRoutes = require("./routes/userRoutes");
const cliniqueRoutes = require("./routes/cliniqueRoutes");
const settingRoutes = require("./routes/settingRoutes"); 
const dossierRoutes = require('./routes/dossierRoutes');
const prestationRoutes = require('./routes/prestationRoutes');
const demandeRoutes = require('./routes/demandeRoutes'); 
const etatRoutes = require('./routes/etatRoutes');      
const agentRoutes = require("./routes/agentRoutes")
// 1. Importation de la route
const pieceRoutes = require('./routes/pieceRoutes');
const captchaRoutes = require('./routes/captchaRoutes'); // Adapte le chemin
// En haut avec tes autres requires
const messageRoutes = require("./routes/messageRoutes");
// ... après tes middlewares (cors, json, etc.)
const session = require('express-session');

const prixPrestationsRoutes = require("./routes/prixPrestationsRoutes");

const noteRoutes = require("./routes/noteRoutes");
const archiveRoutes = require('./routes/archiveRoutes');
const typesprestations = require('./routes/typesprestationsRoutes')

// Vérifie que tu as bien ça dans app.js
const authRoutes = require('./routes/authRoutes');

const fichierRoutes = require('./routes/fichierRoutes')
const statutDossierRoutes = require('./routes/statutDossierRoutes');

//const loginRoutes = require("./routes/loginRoutes");
app.use(session({
  secret: 'votre_secret_ummto', // Change ceci par une phrase aléatoire
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // 'false' car tu es en HTTP (localhost) et non HTTPS
}));
// ... reste du code identique
// --- MIDDLEWARES ---
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost"],// Port de ton Next.js
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // ← ajoute PATCH
  allowedHeaders: ["Content-Type", "Authorization"],   // ← ajoute ça
  credentials: true
}));
// APRÈS — ajoute le type multipart accepté
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    return next(); // laisser multer gérer
  }
  next();
});
// Dans ton server.js côté Backend

// ... (après tes middlewares comme app.use(cors()))

// 2. Utilisation de la route
app.use('/api/pieces', pieceRoutes);

// --- ROUTES API ---
app.use('/api/typesprestations', typesprestations);
app.use("/api/prise-en-charge", priseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clinics", cliniqueRoutes);
app.use("/api/settings", settingRoutes); 
app.use('/api/prestations', prestationRoutes);
app.use('/api/demandes', demandeRoutes); // Ajouté ici
app.use('/api/etats', etatRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api', captchaRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/notes", noteRoutes);
app.use('/api/archives', archiveRoutes);
app.use("/api/fichiers",fichierRoutes);
//app.use("/api", loginRoutes);
app.use("/api/prix-prestations", prixPrestationsRoutes);
app.use('/api/statut-dossiers', statutDossierRoutes);
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend fonctionne !" });
});
app.use('/api/auth', authRoutes);

// --- LOGIQUE D'INITIALISATION ---
const initSettings = async () => {
  const defaults = [
    { key: 'plafond_general', value: '130000' },
    { key: 'plafond_dentaire', value: '50000' },
    { key: 'plafond_ophta', value: '50000' }
  ];

  try {
    for (const s of defaults) {
      await Setting.findOrCreate({
        where: { key: s.key },
        defaults: s
      });
    }
    console.log("✅ Paramètres de plafonds initialisés.");
  } catch (err) {
    console.error("❌ Erreur lors de l'init des settings:", err);
  }
};
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ Client connecté :", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on("send_message", async (data) => {
    try {
      const message = await Message.create({
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
      });

      io.to(message.receiverId).emit("receive_message", message);
      io.to(message.senderId).emit("receive_message", message);

    } catch (err) {
      console.error("❌ Erreur socket :", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client déconnecté :", socket.id);
  });
});
io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.join(`user:${payload.id}`);
    } catch (e) {
      socket.disconnect();
    }
  }
});
// --- DÉMARRAGE SÉCURISÉ ---
const PORT = process.env.PORT || 5001;

// Synchronisation de la base de données
sequelize.sync({ alter: true }) 
  .then(async () => {
    console.log("✅ Base de données synchronisée.");
    
    // Initialisation des plafonds par défaut
    await initSettings();
    
    server.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erreur de synchronisation ou connexion :", err);
  });

