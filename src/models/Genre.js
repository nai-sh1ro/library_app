module.exports = (sequelize, DataTypes) => {
    const Genre = sequelize.define("Genre", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(50), allowNull: false, unique: true }
    },
    {
        tableName: "genre",
        timestamps: false
    });
    Genre.associate = (models) => {
        Genre.belongsToMany(models.Book, {
            through: models.Books_Genres,
            foreignKey: 'genreId',
            otherKey: 'bookId'
        });
    };
    return Genre;
};