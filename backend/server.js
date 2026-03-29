require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// --- DB & Modèles ---
const { sequelize } = require("./config/db");
const { User, Prise } = require("./models"); 
const Setting = require("./models/Setting"); 

// --- CORRECTION ICI : Utilisez ./ car server.js est au même niveau que le dossier models ---
const Etat = require('./models/Etat');
const LigneEtat = require('./models/LigneEtat');

// --- Import des Routes ---
const priseRoutes = require("./routes/priseRoutes");
const userRoutes = require("./routes/userRoutes");
const cliniqueRoutes = require("./routes/cliniqueRoutes");
const settingRoutes = require("./routes/settingRoutes"); 
const dossierRoutes = require('./routes/dossierRoutes');
const prestationRoutes = require('./routes/prestationRoutes');
const demandeRoutes = require('./routes/demandeRoutes'); 
const etatRoutes = require('./routes/etatRoutes');      
// 1. Importation de la route
const pieceRoutes = require('./routes/pieceRoutes');

const app = express();

// ... reste du code identique
// --- MIDDLEWARES ---
app.use(cors({
  origin: "http://localhost:3000", // Port de ton Next.js
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- FICHIERS STATIQUES ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir); } // Crée le dossier si absent
app.use('/uploads', express.static('uploads'));


// ... (après tes middlewares comme app.use(cors()))

// 2. Utilisation de la route
app.use('/api/pieces', pieceRoutes);


// --- ROUTES API ---
app.use("/api/prise-en-charge", priseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clinics", cliniqueRoutes);
app.use("/api/settings", settingRoutes); 
app.use('/api/prestations', prestationRoutes);
app.use('/api/demandes', demandeRoutes); // Ajouté ici
app.use('/api/etats', etatRoutes);
app.use('/api/dossiers', dossierRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend fonctionne !" });
});

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

// --- DÉMARRAGE SÉCURISÉ ---
const PORT = process.env.PORT || 5001;

// Synchronisation de la base de données
sequelize.sync({ alter: true }) 
  .then(async () => {
    console.log("✅ Base de données synchronisée.");
    
    // Initialisation des plafonds par défaut
    await initSettings();
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erreur de synchronisation ou connexion :", err);
  });