// Déconnexion : détruit la session côté serveur

const express = require("express");
const router = express.Router();

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Erreur déconnexion' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Déconnecté' });
  });
});