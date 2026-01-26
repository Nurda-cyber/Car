const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('MESSAGE', 'PRICE_DROP', 'TEST_DRIVE_APPROVED', 'general'),
    defaultValue: 'general',
    allowNull: false
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  relatedCarId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'cars',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  relatedUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

module.exports = Notification;
