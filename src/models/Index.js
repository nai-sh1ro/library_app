const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const User = require('./User')(sequelize, DataTypes);
const Book = require('./Book')(sequelize, DataTypes);
const Genre = require('./Genre')(sequelize, DataTypes);
const Books_Users = require('./Books_Users')(sequelize, DataTypes);
const Books_Genres = require('./Books_Genres')(sequelize, DataTypes);

const models = {
    User,
    Book,
    Genre,
    Books_Users,
    Books_Genres
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