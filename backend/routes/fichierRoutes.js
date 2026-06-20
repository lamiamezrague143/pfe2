const router = require('express').Router();
const upload = require('../middleware/upload');
const Fichier = require('../models/Fichier');

// Upload — stocke direct en base64 dans la colonne `data`
router.post('/upload', upload.single('fichier'), async (req, res) => {
  try {
    const f = req.file;
    if (!f) return res.status(400).json({ error: "Aucun fichier reçu" });

    const fichier = await Fichier.create({
      nom_original: f.originalname,
      nom_stockage: null,
      chemin: null,
      data: f.buffer.toString('base64'), // ✅ contenu réel du fichier
      mime_type: f.mimetype,
      taille: f.size,
      entite_type: req.body.entite_type || null,
      entite_id: req.body.entite_id || null,
    });

    res.json({ success: true, fichier: { id: fichier.id, nom_original: fichier.nom_original } });
  } catch (err) {
    console.error("Erreur upload fichier:", err);
    res.status(500).json({ error: err.message });
  }
});

// Récupérer un fichier (décode le base64 et le renvoie comme un vrai fichier)
router.get('/:id', async (req, res) => {
  try {
    const fichier = await Fichier.findByPk(req.params.id);
    if (!fichier || !fichier.data) {
      return res.status(404).json({ error: 'Fichier introuvable' });
    }

    const buffer = Buffer.from(fichier.data, 'base64');
    res.set('Content-Type', fichier.mime_type);
    res.set('Content-Disposition', `inline; filename="${fichier.nom_original}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer
router.delete('/:id', async (req, res) => {
  try {
    const fichier = await Fichier.findByPk(req.params.id);
    if (!fichier) return res.status(404).json({ error: 'Fichier introuvable' });
    await fichier.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;