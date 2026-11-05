module.exports = (sequelize, DataTypes) => {
    const Book = sequelize.define('Book', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        isbn: { type: DataTypes.STRING(13), allowNull: true, unique: true },
        title: { type: DataTypes.STRING(100), allowNull: false },
        author: { type: DataTypes.STRING(100), allowNull: false },
        publisher: {type: DataTypes.STRING(100), allowNull: false},
        year: { type: DataTypes.INTEGER, allowNull: false },
        coverURL: { type: DataTypes.STRING(255), allowNull: true }
    },
    {
        tableName: 'books',
        timestamps: false
    });

    Book.associate = (models) => {
        Book.belongsToMany(models.User, {
            through: models.Books_Users,
            foreignKey: 'bookId',
            otherKey: 'userId'
        });

        Book.belongsToMany(models.Genre, {
            through: models.Books_Genres,
            foreignKey: 'bookId',
            otherKey: 'genreId'
        });
    };
    return Book;
};