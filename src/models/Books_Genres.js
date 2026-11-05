module.exports = (sequelize, DataTypes) => {
  const Books_Genres = sequelize.define('Books_Genres', {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    genreId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    bookId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'books', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }
  }, {
    tableName: 'books_genres',
    timestamps: false,
  });

  return Books_Genres;
};