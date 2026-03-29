const Prise = require("../models/Prise");

// ✅ Récupérer toutes les prises (pour ta section Consulter)
exports.getAllPrises = async (req, res) => {
  try {
    const prises = await Prise.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(prises);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération", error: error.message });
  }
};

// ✅ Calculer le prochain numéro pour la référence
exports.getProchainNumero = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const count = await Prise.count({
      where: { sfEtablissement: clinicId }
    });
    res.json({ next: count + 1 });
  } catch (error) {
    res.status(500).json({ error: "Impossible de calculer le numéro" });
  }
};

// ✅ Créer une nouvelle prise en charge
exports.createPrise = async (req, res) => {
  try {
    const nouvellePrise = await Prise.create(req.body);
    res.status(201).json({ message: "Prise en charge enregistrée ✅", prise: nouvellePrise });
  } catch (error) {
    console.error("Erreur création:", error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement", error: error.message });
  }
};

// ✅ Supprimer une prise
exports.deletePrise = async (req, res) => {
    try {
      await Prise.destroy({ where: { id: req.params.id } });
      res.json({ message: "Supprimé ✅" });
    } catch (err) {
      res.status(500).json({ message: "Erreur suppression" });
    }
};