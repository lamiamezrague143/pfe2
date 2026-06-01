const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Trop de tentatives. Réessayez dans 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = loginLimiter;