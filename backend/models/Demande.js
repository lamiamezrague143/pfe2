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
pour_qui:   { type: DataTypes.ENUM('moi', 'autre'), defaultValue: 'moi' },
lien_parente: { type: DataTypes.STRING, allowNull: true },
  motif_refus: { type: DataTypes.TEXT, allowNull: true },
  message_admin: { type: DataTypes.TEXT, allowNull: true } ,// Pour les dossiers validés
  fichier_prise_en_charge: {
  type: DataTypes.STRING,
  allowNull: true
},
ayant_prenom:     { type: DataTypes.STRING, allowNull: true },
ayant_nom:        { type: DataTypes.STRING, allowNull: true },
ayant_lien:       { type: DataTypes.STRING, allowNull: true },
ayant_date_naiss: { type: DataTypes.DATEONLY, allowNull: true },
ayant_telephone:  { type: DataTypes.STRING, allowNull: true },
}, 
{
  tableName: 'demandes',
  timestamps: true
});
module.exports = Demande;