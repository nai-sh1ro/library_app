module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        username: { type: DataTypes.STRING(25), allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false }
    },
    {
      tableName: 'users',
      timestamps: false
    });

    User.associate = (models) => {
        User.belongsToMany(models.Book, {
            through: models.Books_Users,
            foreignKey: 'userId',
            otherKey: 'bookId'
        });
    };
    return User;
};