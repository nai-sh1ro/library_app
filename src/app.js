const express = require("express");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT;

const app = express();

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`http://localhost:${PORT}/`);
});