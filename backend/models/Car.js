const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Пожалуйста, укажите марку автомобиля'
      }
    }
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Пожалуйста, укажите модель автомобиля'
      }
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1900,
      max: new Date().getFullYear() + 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  engine: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transmission: {
    type: DataTypes.ENUM('manual', 'automatic', 'cvt'),
    allowNull: true
  },
  fuelType: {
    type: DataTypes.ENUM('petrol', 'diesel', 'electric', 'hybrid'),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'sold', 'disabled'),
    defaultValue: 'pending',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'cars',
  timestamps: true
});

module.exports = Car;
