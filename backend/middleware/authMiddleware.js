const jwt = require("jsonwebtoken");

module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ message: "Token manquant" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, "SECRET_KEY");

      req.user = decoded;

      // 🔐 vérification du rôle
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Token invalide" });
    }
  };
};