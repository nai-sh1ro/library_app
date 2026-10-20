const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const PORT = process.env.PORT;

const app = express();

const bookRouter = require('./routes/bookRoute');

app.use(express.static("public"));

app.set("views", path.join(__dirname, "views"));

app.use('/', bookRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`http://localhost:${PORT}/`);
});