const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    spindleSpeed: {
      type: DataTypes.FLOAT,
    },
    vibrationLevel: {
      type: DataTypes.FLOAT,
    },
    toolWear: {
      type: DataTypes.FLOAT,
    },
    temperature: {
      type: DataTypes.FLOAT,
    },
    energyConsumption: {
      type: DataTypes.FLOAT,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
  return Device;
};