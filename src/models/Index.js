const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const User = require('./User')(sequelize, DataTypes);
const Book = require('./Book')(sequelize, DataTypes);
const Books_Users = require('./Books_Users')(sequelize, DataTypes);

const models = {
    User,
    Book,
    Books_Users
};

Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

module.exports = {
  ...models,
  sequelize
};