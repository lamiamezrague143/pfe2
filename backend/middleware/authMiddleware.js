const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement");
}

module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        logger.error("Token manquant", { url: req.originalUrl });
        return res.status(401).json({ message: "Token manquant" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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