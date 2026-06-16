const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { sequelize } = require('../config/db'); // ✅ import correct
const PasswordResetOtp = require('../models/PasswordResetOtp'); // ← important !

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const addMinutes = (date, minutes) => {
  const d = new Date(date.getTime() + minutes * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// ── ÉTAPE 1 : Envoyer l'OTP ───────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis.' });

  try {
    const users = await sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      { replacements: { email }, type: sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0)
      return res.status(404).json({ message: 'Aucun compte associé à cet email.' });

    const userId = users[0].id;

    await sequelize.query(
      'DELETE FROM password_reset_otps WHERE user_id = :userId',
      { replacements: { userId } }
    );

    const otp = generateOTP();
    const expiresAt = addMinutes(new Date(), 5);

    await sequelize.query(
      'INSERT INTO password_reset_otps (user_id, otp, expires_at) VALUES (:userId, :otp, :expiresAt)',
      { replacements: { userId, otp, expiresAt } }
    );

    await transporter.sendMail({
      from: `"UMMTO Œuvres Sociales" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Code de réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #0d9488;">Réinitialisation de mot de passe</h2>
          <p>Votre code OTP de réinitialisation est :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                      color: #0d9488; text-align: center; padding: 16px 0;">
            ${otp}
          </div>
          <p>Ce code est valide pendant <strong>5 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 12px;">
            Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
        </div>
      `,
    });

    res.json({ message: 'Code OTP envoyé à votre adresse email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── ÉTAPE 2 : Vérifier l'OTP ──────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: 'Email et OTP requis.' });

  try {
    const users = await sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      { replacements: { email }, type: sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0)
      return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const userId = users[0].id;

    const rows = await sequelize.query(
      `SELECT * FROM password_reset_otps
       WHERE user_id = :userId AND otp = :otp AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      { replacements: { userId, otp }, type: sequelize.QueryTypes.SELECT }
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'Code OTP invalide.' });

    const record = rows[0];

    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'Code OTP expiré. Veuillez en demander un nouveau.' });

    await sequelize.query(
      'UPDATE password_reset_otps SET used = 1 WHERE id = :id',
      { replacements: { id: record.id } }
    );

    res.json({ message: 'OTP vérifié avec succès.', verified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── ÉTAPE 3 : Réinitialiser le mot de passe ───────────────────
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ message: 'Champs manquants.' });

  if (newPassword.length < 8)
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });

  try {
    const users = await sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      { replacements: { email }, type: sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0)
      return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const userId = users[0].id;

    const rows = await sequelize.query(
      `SELECT * FROM password_reset_otps
       WHERE user_id = :userId AND otp = :otp AND used = 1
       ORDER BY created_at DESC LIMIT 1`,
      { replacements: { userId, otp }, type: sequelize.QueryTypes.SELECT }
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'OTP non vérifié. Recommencez le processus.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      'UPDATE users SET password = :hashedPassword WHERE id = :userId',
      { replacements: { hashedPassword, userId } }
    );

    await sequelize.query(
      'DELETE FROM password_reset_otps WHERE user_id = :userId',
      { replacements: { userId } }
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── Déconnexion ────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Erreur déconnexion' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Déconnecté' });
  });
});

module.exports = router;