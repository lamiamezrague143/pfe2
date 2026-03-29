const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Création automatique des dossiers s'ils n'existent pas
const dirs = ['uploads', 'uploads/ordonnances', 'uploads/photos'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Dossier créé : ${dir}`);
  }
});

// 2. Configuration du stockage (C'est ce qui manquait !)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // On choisit le sous-dossier selon le nom du champ dans le formulaire
    if (file.fieldname === "ordonnance") {
      cb(null, 'uploads/ordonnances/');
    } else if (file.fieldname === "photo") {
      cb(null, 'uploads/photos/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    // On crée un nom unique : TIMESTAMP-NOM_ORIGINAL
    // Exemple : 171025485.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 3. Initialisation de Multer avec la config storage
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5Mo par fichier
  fileFilter: (req, file, cb) => {
    // On accepte uniquement les images et les PDF
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Seuls les formats JPG, PNG et PDF sont autorisés !"));
  }
});

module.exports = upload;