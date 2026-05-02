const Archive = require('../models/Archive');

exports.createArchive = async (req, res) => {
  try {
    // Vérification si un fichier est présent
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été scanné." });
    }

    // Enregistrement des infos dans MySQL via Sequelize
    const nouvelleArchive = await Archive.create({
      nomDossier: req.body.nomDossier,
      nomFichier: req.file.filename,
      typeFichier: req.file.mimetype,
      taille: req.file.size
      
    });

    res.status(201).json(nouvelleArchive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArchives = async (req, res) => {
  try {
    const archives = await Archive.findAll({
      order: [['createdAt', 'DESC']] // Les plus récents en premier
    });
    res.json(archives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};