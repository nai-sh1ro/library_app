const bcrypt = require("bcrypt");
const { User } = require("../models");
const allowedCredential = /^[\x21-\x7E]+$/;

async function renderRegistration(req, res) {
  res.status(200).render("auth/registration.ejs", { error: null });
}

async function renderLogin(req, res) {
  res.status(200).render("auth/login.ejs", { error: null });
}

async function register(req, res) {
  const { username, password } = req.body;
  if (!allowedCredential.test(username) || !allowedCredential.test(password)) {
    return res.status(422).render("auth/registration.ejs", { error: "Недопустимые символы в логине или пароле" });
  }
  if (!username || !password) {
    return res.status(400).render("auth/registration.ejs", { error: "Логин и пароль обязательны к заполнению" });
  }
  if (password.length <= 7) {
    return res.status(400).render("auth/registration.ejs", { error: "Пароль должен быть не короче 8 символов" });
  }
  try{
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ username: username, password: hashedPassword });
    //.regenerate() удаляет прошлую сессию и генерирует новый Session ID в req.session
    await new Promise((resolve, reject) => {
      req.session.regenerate(error => error ? reject(error) : resolve());
    });
    //Добаляет информацию о пользователе в req.session
    req.session.user = { id: user.id, username: user.username };
    //Кидает req.session в DB
    await new Promise((resolve, reject) => {
      req.session.save(error => error ? reject(error) : resolve());
    });
    return res.status(201).redirect('/');
  } 
  catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).render("auth/registration.ejs", { error:'Такое имя пользователя уже занято'});
    }
    console.error(error);
    return res.status(500).render("auth/registration.ejs", { error: 'Не удалось создать аккаунт'});
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!allowedCredential.test(username) || !allowedCredential.test(password)) {
    return res.status(422).render("auth/login.ejs", { error: "Недопустимые символы в логине или пароле" });
  }
  if (!username || !password) {
    return res.status(400).render("auth/login.ejs", { error: "Логин и пароль обязательны к заполнению" });
  }
  if (password.length <= 7) {
    return res.status(400).render("auth/login.ejs", { error: "Пароль должен быть не короче 8 символов" });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('auth/login.ejs', {error: 'Неверное имя пользователя или пароль'});
    }
    await new Promise((resolve, reject) => {
      req.session.regenerate(error => error ? reject(error) : resolve());
    });
    req.session.user = { id: user.id, username: user.username };
    await new Promise((resolve, reject) => {
      req.session.save(error => error ? reject(error) : resolve());
    });
    return res.status(200).redirect('/');
  } 
  catch (error) {
    console.error(error);
    return res.status(500).render("auth/login.ejs", { error: 'Не удалось войти в аккаунт' });
  }
}

function logout(req, res) {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).send('Не удалось завершить сессию');
        }

        res.clearCookie('connect.sid');
        console.log('Сессия завершена');
        return res.redirect('/');
    });
}

module.exports = {renderRegistration, renderLogin, register, login, logout};