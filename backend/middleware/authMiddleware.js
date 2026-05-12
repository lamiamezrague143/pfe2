const jwt = require("jsonwebtoken");
module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: "Token manquant" });

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_PFE_2026");

      req.user = decoded;

      // ✅ Log ICI, avant le return
      console.log("ROLE TOKEN:", decoded.role);
      console.log("ROLES AUTORISÉS:", roles);

      if (roles.length && !roles.includes(decoded.role?.toLowerCase())) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      next();
    } catch (err) {
      console.error("AUTH ERROR:", err);
      return res.status(401).json({ message: "Token invalide" });
    }
  };
};