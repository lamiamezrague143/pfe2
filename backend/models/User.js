const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define("User", {
  nomComplet: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      // CORRECTED: On enregistre bien dans 'nomComplet'
      this.setDataValue("nomComplet", value ? value.toUpperCase() : ""); 
    },
  },
  prenomComplet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateNaissance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  lieuNaissance: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sexe: { 
    type: DataTypes.ENUM("Homme", "Femme"),
    allowNull: true,
     defaultValue: "Homme",
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,
  },
  email: { 
    type: DataTypes.STRING,
    allowNull: true,
    
    
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // models/User.js

  departement: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "Informatique",
  },
// models/User.js
// models/User.js
photo: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: "default.jpg",
  },
  positionAdministrative: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "position", // correspond à la colonne 'position' dans MySQL
  },
  categorieRole: {
    type: DataTypes.STRING,
    field: "role", // correspond à la colonne 'role' dans MySQL
  },
  ayantDroits: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  firstLogin: {
  type: DataTypes.BOOLEAN,
  defaultValue: true,
},

roleSystem: {
  type: DataTypes.ENUM(
    "president",
    "secretariat",
    "comptable",
    "ingenieur",
    "agent",
    "beneficiaire"
  ),
  allowNull: false
},

resetPasswordToken: {
  type: DataTypes.STRING,
  allowNull: true,
},
generatedPassword: {
  type: DataTypes.STRING,
  allowNull: true,
},
// Ajouter dans models/User.js
publicKey: {
  type: DataTypes.TEXT,
  allowNull: true,
},
// ✅ Ajoutez juste en dessous :
privateKey: {
  type: DataTypes.TEXT,
  allowNull: true,
},
}, {
  timestamps: true, // utilise createdAt et updatedAt
});

module.exports = User;