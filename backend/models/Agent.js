const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Agent = sequelize.define("Agent", {
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  }
},{
  tableName: 'agents',
  timestamps: true
});


module.exports = Agent;