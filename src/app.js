require('dotenv').config();

const express = require("express");
const path = require("path");
const { sequelize } = require("./config/database");
const sessionsConfig = require('./config/sessions');

const bookRouter = require('./routes/bookRoute');
const authRouter = require('./routes/authRoute');

const PORT = process.env.PORT;

const app = express();
sessionsConfig(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("views", path.join(__dirname, "views"));

app.use('/', bookRouter);
app.use('/', authRouter);

app.use((req, res) => {
    res.status(404).render('auth/error.ejs',{responseCode: 404, message: "Страница не найдена"});
});

async function startServer() {


    try {
        await sequelize.authenticate();
        await sequelize.sync();

       app.listen(PORT, () => {
          console.log(`Сервер запущен на порту ${PORT}`);
          console.log(`http://localhost:${PORT}/`);
        });
    } catch (error) {
        console.error('Не удалось подключиться к базе данных:', error);
        process.exitCode = 1;
    }
}

startServer();
