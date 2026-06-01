const { body, validationResult } = require("express-validator");

// Validation login
const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Mot de passe minimum 6 caractères")
    .trim(),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    next();
  }
];

// Validation dossier
const validateDossier = [
  body("nom")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Nom obligatoire"),

  body("prenom")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Prénom obligatoire"),

  body("email")
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail(),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    next();
  }
];

module.exports = {
  validateLogin,
  validateDossier
};