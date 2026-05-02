const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
/////////////// demande client 
const Demande = sequelize.define('Demande', {
    userId: {
  type: DataTypes.INTEGER,
  allowNull: false
},
  nom_beneficiaire: { type: DataTypes.STRING, allowNull: false },
  sexe: { type: DataTypes.STRING }, // Ajouté
  telephone: { type: DataTypes.STRING }, // Ajouté
  date_naissance: { type: DataTypes.DATEONLY }, // Ajouté
  lieu_naissance: { 
  type: DataTypes.STRING, 
  allowNull: true 
},
  type_prestation: { type: DataTypes.STRING, allowNull: false },
  fonction: { type: DataTypes.STRING, defaultValue: "Personnel" },
  // Ton modèle est déjà bon, assure-toi juste que 'pieces' est bien en JSON
pieces: {
  type: DataTypes.JSON, // Utilise JSON pour stocker le tableau d'objets [ {nom, type, data}, ... ]
  allowNull: true,

  defaultValue: [] 
},
  statut: { 
    type: DataTypes.ENUM('En attente', 'Validée', 'Rejetée'), 
    defaultValue: 'En attente' 
  },
  etablissement: {
  type: DataTypes.STRING,
  allowNull: true
},
  motif_refus: { type: DataTypes.TEXT, allowNull: true },
  message_admin: { type: DataTypes.TEXT, allowNull: true } // Pour les dossiers validés
}, {
  tableName: 'demandes',
  timestamps: true
});
module.exports = Demande;