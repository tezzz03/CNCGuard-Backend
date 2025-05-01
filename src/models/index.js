const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: true,
    },
  },
});

const User = require('./User')(sequelize);
const Device = require('./Device')(sequelize);

User.hasMany(Device, { foreignKey: 'userId' });
Device.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Device };