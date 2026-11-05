const { Book, Genre, Books_Genres, Books_Users} = require("../models");
const { Op } = require('sequelize');


async function renderIndex(req, res) {
  res.status(200).render("book/index.ejs");
}

async function renderCreate(req, res){
  if (!req.session.user){
    return res.status(401).redirect("/login");
  }
  try {
    const genres = await Genre.findAll({ order: [['name', 'ASC']] });
    return res.status(200).render("book/create.ejs", { error: null, genres, title: '' });
  } catch (error) {
    console.error(error);
    return res.status(500).render("book/create.ejs", {error: "Не удалось загрузить список жанров", genres: [], title: ''});
  }
}

async function getBookByISBN(req, res) {

  const isbn = req.body.ISBN.replace(/\D/g, ''); // Только цифры.
  if (isbn.length !== 13) { //Длина.
    
    return res.status(422).json({ error: 'ISBN должен содержать 13 цифр' });
  }

  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    return res.status(400).json({ error:'Не удалось получить данные от Google Books' });
  }
  return res.status(200).json(data);
}

async function createBook(req, res) {
  let coverURL = null;
  console.log(req.body);
  try {
    if (!req.session.user){
      return res.status(401).redirect("/login");
    }
    if (req.file) {
      coverURL = `/uploads/${req.file.filename}`;
    } else if (req.body.coverUrl) {
      const url = new URL(req.body.coverUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return res.status(400).send("Недопустимая ссылка на обложку");
      }
      coverURL = url.toString();
    }
    const book =  await Book.create({
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher,
      year: Number(req.body.year),
      isbn: req.body.ISBN || null,
      coverURL
    }); 
    const genreIds = Array.isArray(req.body.genreIds) ? req.body.genreIds : req.body.genreIds ? [req.body.genreIds] : [];
    for (const genreId of genreIds) {
      await Books_Genres.create({
        bookId: book.id,
        genreId: Number(genreId)
      });
    }
    await Books_Users.create({
      bookId: book.id,
      userId: req.session.user.id,
      status: "Не прочитана"
    });
    return res.status(201).redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Не удалось создать книгу");
  }
}

async function searchBooks(req, res) {
  console.log(req.body.find);
  console.log(req.body.find);
  const books = await Book.findAll({
  where: {
    [Op.or]: [
      { title: { [Op.like]: `%${req.body.find}%` } },
      { isbn: req.body.find }
    ]
  }});
  if(books.length === 0){
    return res.status(401).render("book/add.ejs", {notFound: "Если ничего не нашли", link: "пополните нашу коллекцию вашей книгой."});
  }
}

module.exports = {renderIndex, renderCreate, searchBooks, getBookByISBN, createBook};