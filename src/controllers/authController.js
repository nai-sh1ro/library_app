const bcrypt = require("bcrypt");
const { User } = require("../models");
const allowedCredential = /^[\x21-\x7E]+$/;

async function renderRegistration(req, res) {
    if (req.session.user){
      return res.status(302).redirect("/profile");
    }
  res.status(200).render("auth/registration.ejs", { error: null });
}

async function renderLogin(req, res) {
    if (req.session.user){
      return res.status(302).redirect("/profile");
    }
  res.status(200).render("auth/login.ejs", { error: null });
}

async function renderProfile(req, res){
  if (!req.session.user){
    return res.status(302).redirect("/login");
  }
  res.status(200).render("auth/profile.ejs", { error: null });
}
async function register(req, res) {
  const { username, password } = req.body;
  if (!allowedCredential.test(username) || !allowedCredential.test(password)) {
    return res.status(422).json({ error: "Недопустимые символы в логине или пароле" });
  }
  if (!username || !password) {
    return res.status(400).json({ error: "Логин и пароль обязательны к заполнению" });
  }
  if (password.length <= 7) {
    return res.status(400).json({ error: "Пароль должен быть не короче 8 символов" });
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
    return res.status(303).redirect("/");
  } 
  catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Такое имя пользователя уже занято' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Не удалось создать аккаунт' });
  }
}
async function login(req, res) {
  const { username, password } = req.body;
  if (!allowedCredential.test(username) || !allowedCredential.test(password)) {
    return res.status(422).json({ error: "Недопустимые символы в логине или пароле" });
  }
  if (!username || !password) {
    return res.status(400).json({ error: "Логин и пароль обязательны к заполнению" });
  }
  if (password.length <= 7) {
    return res.status(400).json({ error: "Пароль не может быть менее 8 символов" });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }
    await new Promise((resolve, reject) => {
      req.session.regenerate(error => error ? reject(error) : resolve());
    });
    req.session.user = { id: user.id, username: user.username };
    await new Promise((resolve, reject) => {
      req.session.save(error => error ? reject(error) : resolve());
    });
    return res.status(303).redirect("/");
  } 
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Не удалось войти в аккаунт' });
  }
}

function logout(req, res) {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).send('Не удалось завершить сессию');
        }

        res.clearCookie('connect.sid');
        return res.status(303).redirect('/');
    });
}

async function deleteProfile(req, res){
    if (!req.session.user){
      return res.status(302).redirect("/login");
    }
    await User.destroy({where: {id: req.session.user.id}});
    req.session.destroy(error => {
        if (error) {
            return res.status(500).send('Не удалось завершить сессию');
        }
        res.clearCookie('connect.sid');
        return res.status(303).redirect('/');
    });
}

async function updateProfile(req, res) {
  const username = req.body.NewUsername;
  if (!req.session.user){
    return res.status(302).redirect("/login");
  }
  if (!allowedCredential.test(username)) {
    return res.status(422).json({ error: "Недопустимые символы в логине или пароле" });
  }
  if (!username) {
    return res.status(400).json({ error: "Логин и пароль обязательны к заполнению" });
  }
  try{
    const [updatedCount] = await User.update(
      {username: username},
      {where:{id: req.session.user.id}}
    )
    req.session.user.username = username;

    await new Promise((resolve, reject) => {
      req.session.save(error => error ? reject(error) : resolve());
    });

    return res.status(200).redirect('/profile');
  }
  catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Такое имя пользователя уже занято' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Не удалось создать аккаунт' });
  }
}

async function feedback(req, res) {
  const { comment, contact } = req.body;
  if (!comment || !contact) {
    return res.status(400).json({ error: 'Комментарий и контакт обязательны к заполнению' });
  }
  if (!process.env.TG_BOT_TOKEN || !process.env.CHAT_ID) {
    console.error('Telegram feedback is not configured: TG_BOT_TOKEN or CHAT_ID is missing');
    return res.status(500).json({ error: 'Сервис обратной связи не настроен' });
  }
  try {
    const url = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        chat_id: process.env.CHAT_ID,
        parse_mode: 'HTML',
        text: `<b>Сообщение от пользователя:</b>\n${comment}\n<b>Контакты для связи:</b>\n${contact}\n<b>Данные пользователя:</b>\n${req.session.user?.id || 'неизвестно'}\n${req.session.user?.username || 'неизвестно'}`
      })
    });
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(`Telegram returned a non-JSON response (HTTP ${response.status})`);
      return res.status(502).json({ error: 'Не удалось отправить сообщение в Telegram' });
    }
    if (!response.ok || !data.ok) {
      console.error('Telegram sendMessage failed:', {
        status: response.status,
        errorCode: data.error_code,
        description: data.description
      });
      return res.status(502).json({ error: 'Не удалось отправить сообщение в Telegram' });
    }
    return res.status(200).json({ message: 'Сообщение отправлено успешно' });
  } catch (error) {
    console.error('Telegram request failed:', error.name);
    return res.status(502).json({ error: 'Не удалось отправить сообщение в Telegram' });
  }
}

module.exports = {renderRegistration, renderLogin, register, login, logout, renderProfile, deleteProfile, updateProfile, feedback};