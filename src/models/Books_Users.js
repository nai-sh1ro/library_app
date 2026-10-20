module.exports = (sequelize, DataTypes) => {
  const Books_Users = sequelize.define('Books_Users', {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    bookId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'books', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    status: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'books_users',
    timestamps: false,
  });

  return Books_Users;
};