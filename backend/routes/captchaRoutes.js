
const express = require("express");
const router = express.Router();
const svgCaptcha = require('svg-captcha');

// Route : GET /api/captcha
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,           // 4 caractères pour que ce soit rapide à taper
    noise: 3,          // Nombre de lignes de bruit
    color: true,       // Caractères en couleur
    background: '#f3f4f6' // Couleur proche de ton design actuel
  });

  // On stocke la réponse en session pour la vérification future
  req.session.captcha = captcha.text.toLowerCase();

  // On envoie le SVG au frontend
  res.type('svg');
  res.status(200).send(captcha.data);
});
module.exports = router; // ✅ IMPORTANT