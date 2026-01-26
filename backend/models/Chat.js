const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  carId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cars',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'chats',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['carId', 'buyerId', 'sellerId']
    }
  ]
});

module.exports = Chat;
