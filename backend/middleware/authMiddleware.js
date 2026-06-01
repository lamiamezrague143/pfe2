const jwt = require("jsonwebtoken");
const logger = require("../config/logger"); // adapte le chemin

module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        logger.error("Token manquant", { url: req.originalUrl });
        return res.status(401).json({ message: "Token manquant" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_PFE_2026");
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role?.toLowerCase())) {
        logger.error("Accès refusé", { role: decoded.role, url: req.originalUrl });
        return res.status(403).json({ message: "Accès refusé" });
      }

      next();
    } catch (err) {
      logger.error("Token invalide", { error: err.message, url: req.originalUrl });
      return res.status(401).json({ message: "Token invalide" });
    }
  };
};