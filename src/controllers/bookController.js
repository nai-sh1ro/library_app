const { Book, Genre, Books_Genres, Books_Users, sequelize } = require("../models");
const { Op } = require('sequelize');
const path = require("path");

const BOOKS_PER_PAGE = 10;
const allowedBookStatuses = ["Не прочитана", "Читаю", "Прочитана"];
const sortFields = {
  "title-asc": ["title", "ASC"],
  "title-desc": ["title", "DESC"],
  "author-asc": ["author", "ASC"],
  "author-desc": ["author", "DESC"],
  "year-asc": ["year", "ASC"],
  "year-desc": ["year", "DESC"]
};

function getListingQuery(req) {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const sort = typeof req.query.sort === "string" && sortFields[req.query.sort] ? req.query.sort : "";
  const status = typeof req.query.status === "string" && allowedBookStatuses.includes(req.query.status)
    ? req.query.status
    : "";

  return { page, search, sort, status };
}

async function getBookSearchWhere(search) {
  if (!search) {
    return {};
  }

  const pattern = `%${search}%`;
  const matchingGenres = await Genre.findAll({
    where: { name: { [Op.like]: pattern } },
    attributes: ["id"],
    raw: true
  });
  const genreIds = matchingGenres.map(genre => genre.id);
  const matchingGenreBooks = genreIds.length
    ? await Books_Genres.findAll({
        where: { genreId: { [Op.in]: genreIds } },
        attributes: ["bookId"],
        raw: true
      })
    : [];
  const matchingBookIds = [...new Set(matchingGenreBooks.map(link => link.bookId))];
  const searchConditions = [
    { title: { [Op.like]: pattern } },
    { author: { [Op.like]: pattern } }
  ];

  if (matchingBookIds.length) {
    searchConditions.push({ id: { [Op.in]: matchingBookIds } });
  }

  return { [Op.or]: searchConditions };
}

function getPaginationContext(page, count, search, sort, status = "") {
  const totalPages = Math.max(1, Math.ceil(count / BOOKS_PER_PAGE));
  return {
    page: Math.min(page, totalPages),
    totalPages,
    search,
    sort,
    status
  };
}

async function renderIndex(req, res) {
  const result = await Book.findAndCountAll({
    attributes: [
      "id",
      "title",
      "author",
      "year",
      "coverURL",
      [
        sequelize.fn(
          "COUNT",
          sequelize.fn("DISTINCT", sequelize.col("UserBooks.userId"))
        ),
        "userCount"
      ]
    ],
    include: [
      {
        model: Books_Users,
        as: "UserBooks",
        attributes: [],
        required: true
      }
    ],
    group: ["Book.id", "Book.title", "Book.author", "Book.year", "Book.coverURL"],
    order: [
      [sequelize.literal('"userCount"'), "DESC"],
      ["title", "ASC"]
    ],
    limit: 5,
    subQuery: false
  });
  res.status(200).render("book/index.ejs", { books: result.rows });

}

async function renderCreate(req, res){
  if (!req.session.user){
    return res.status(302).redirect("/login");
  }
  try {
    const genres = await Genre.findAll({ order: [['name', 'ASC']] });
    return res.status(200).render("book/create.ejs", { error: null, genres, title: '' });
  } catch (error) {
    console.error(error);
    return res.status(500).render("book/create.ejs", {error: "Не удалось загрузить список жанров", genres: [], title: ''});
  }
}
async function renderBooks(req, res) {
  if (!req.session.user){
    return res.status(302).redirect("/login");
  }
  const { page: requestedPage, search, sort, status } = getListingQuery(req);
  try {
    const where = await getBookSearchWhere(search);
    const userBooksWhere = { userId: req.session.user.id };
    if (status) {
      userBooksWhere.status = status;
    }

    const result = await Book.findAndCountAll({
      where,
      include: [
        {
          model: Books_Users,
          as: 'UserBooks',
          where: userBooksWhere,
          attributes: ['status'],
          required: true
        },
        { model: Genre }
      ],
      distinct: true,
      col: "id",
      limit: BOOKS_PER_PAGE,
      offset: (requestedPage - 1) * BOOKS_PER_PAGE,
      order: sortFields[sort]
        ? [sortFields[sort], ["id", "ASC"]]
        : [["id", "ASC"]]
    });
    const pagination = getPaginationContext(requestedPage, result.count, search, sort, status);
    const books = pagination.page === requestedPage
      ? result.rows
      : (await Book.findAll({
          where,
          include: [
            {
              model: Books_Users,
              as: "UserBooks",
              where: userBooksWhere,
              attributes: ["status"],
              required: true
            },
            { model: Genre }
          ],
          limit: BOOKS_PER_PAGE,
          offset: (pagination.page - 1) * BOOKS_PER_PAGE,
          order: sortFields[sort]
            ? [sortFields[sort], ["id", "ASC"]]
            : [["id", "ASC"]]
        }));

    return res.status(200).render("book/books.ejs", { books, error: null, ...pagination });
  } catch (error) {
    console.error(error);
    return res.status(500).render("book/books.ejs", {
      error: "Не удалось загрузить список книг",
      books: [],
      page: 1,
      totalPages: 1,
      search,
      sort,
      status
    });
  }
}
async function renderAdd(req, res) {
  if (!req.session.user){
    return res.status(302).redirect("/login");
  }
  const { page: requestedPage, search, sort } = getListingQuery(req);
  try {
    const where = await getBookSearchWhere(search);
    const result = await Book.findAndCountAll({
      where,
      include: [
        {
          model: Books_Users,
          as: "UserBooks",
          where: { userId: req.session.user.id },
          attributes: ["status"],
          required: false
        },
        { model: Genre }
      ],
      distinct: true,
      col: "id",
      limit: BOOKS_PER_PAGE,
      offset: (requestedPage - 1) * BOOKS_PER_PAGE,
      order: sortFields[sort]
        ? [sortFields[sort], ["id", "ASC"]]
        : [["id", "ASC"]]
    });
    const pagination = getPaginationContext(requestedPage, result.count, search, sort);
    const books = pagination.page === requestedPage
      ? result.rows
      : (await Book.findAll({
          where,
          include: [
            {
              model: Books_Users,
              as: "UserBooks",
              where: { userId: req.session.user.id },
              attributes: ["status"],
              required: false
            },
            { model: Genre }
          ],
          limit: BOOKS_PER_PAGE,
          offset: (pagination.page - 1) * BOOKS_PER_PAGE,
          order: sortFields[sort]
            ? [sortFields[sort], ["id", "ASC"]]
            : [["id", "ASC"]]
        }));

    return res.status(200).render("book/add.ejs", { books, error: null, ...pagination });
  } catch (error) {
    console.error(error);
    return res.status(500).render("book/add.ejs", {
      error: "Не удалось загрузить список книг",
      books: [],
      page: 1,
      totalPages: 1,
      search,
      sort,
      status: ""
    });
  }
}
async function updateBookStatus(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const bookId = Number(req.params.id);
  const allowedStatuses = ["Не прочитана", "Читаю", "Прочитана"];

  if (!Number.isSafeInteger(bookId) || bookId <= 0 || !allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ error: "Некорректный статус или ID книги" });
  }

  try {
    const [updatedCount] = await Books_Users.update(
      { status: req.body.status },
      {
        where: {
          bookId,
          userId: req.session.user.id
        }
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ error: "Книга не найдена в вашей коллекции" });
    }

    return res.status(200).json({ status: req.body.status });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Не удалось обновить статус книги" });
  }
}

async function getIMG(req, res) {
    const URL = await Book.findOne({ where: { id: req.params.id }, attributes: ["coverURL"], raw: true });
    if (!URL) {
      return res.status(404).send("Книга не найдена");
    }
    if (URL.coverURL.startsWith("http://") || URL.coverURL.startsWith("https://")) {
      return res.status(200).redirect(URL.coverURL);
    }
    return res.status(200).sendFile(path.resolve(__dirname, URL.coverURL));
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
      return res.status(302).redirect("/login");
    }
    if (req.file) {
      coverURL = `../data/covers/${req.file.filename}`;
    } else if (req.body.coverUrl) {
      const url = new URL(req.body.coverUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return res.status(422).render("book/create.ejs", {error: "Недопустимая ссылка на обложку", genres: [], title: ''});
      }
      coverURL = url.toString();
    }
    if(await Book.findOne({ where: { isbn: req.body.ISBN } })) {
      return res.status(409).render("book/create.ejs", {error: "Книга с таким ISBN уже существует", genres: [], title: ''});
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
      await Books_Genres.create({bookId: book.id, genreId: Number(genreId)});
    }
    await Books_Users.create({bookId: book.id, userId: req.session.user.id, status: "Не прочитана"});
    return res.status(201).redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).render("book/create.ejs", {error: "Не удалось создать книгу", genres: [], title: ''});
  }
}
async function deleteBook(req, res) {
    if (!req.session.user){
      return res.status(302).redirect("/login");
    }
  await Books_Users.destroy({ where: { bookId: req.params.id, userId: req.session.user.id } });
  return res.status(200).json({ message: "Книга удалена" });
}
async function addBook(req, res) {
    if (!req.session.user){
      return res.status(302).redirect("/login");
    }
  await Books_Users.create({bookId: req.params.id, userId: req.session.user.id, status: "Не прочитана"});
  return res.status(200).json({ message: "Книга добавлена" });
}

module.exports = {renderIndex, renderCreate, renderBooks, updateBookStatus, getBookByISBN, createBook, getIMG, deleteBook, renderAdd, addBook};