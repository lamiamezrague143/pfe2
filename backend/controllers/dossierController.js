const { Dossier, PieceDossier } = require('../models');
const { sequelize } = require('../config/db');

exports.ajouterDossier = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { nom_beneficiaire, type_prestation, pieces_deposees, num_sequence, fonction } = req.body;

    // 1. Créer le dossier
    const nouveauDossier = await Dossier.create({
      num_sequence,
      nom_beneficiaire,
      type_prestation,
      fonction
    }, { transaction: t });

    // 2. Ajouter les pièces (si elles existent)
    if (pieces_deposees && pieces_deposees.length > 0) {
      const piecesObjets = pieces_deposees.map(nomPiece => ({
        nom: nomPiece,
        dossierId: nouveauDossier.id
      }));

      await PieceDossier.bulkCreate(piecesObjets, { transaction: t });
    }

    await t.commit();

    res.status(201).json(nouveauDossier);

  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Erreur lors de la création", error });
  }
};