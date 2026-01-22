const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
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
  carId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cars',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'carts',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'carId']
    }
  ]
});

module.exports = Cart;
