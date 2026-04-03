const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Note = sequelize.define("Note", {
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM("a_faire", "en_cours", "termine"),
    defaultValue: "a_faire"
  },
  agentNom: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "notes",
  timestamps: true
});

module.exports = Note;