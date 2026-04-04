// Structure simplifiée pour ton PFE

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  image: {
  type: DataTypes.STRING,
  allowNull: true,
}
}, {
  timestamps: true, // createdAt + updatedAt
});

module.exports = Message;