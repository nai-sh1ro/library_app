const route = require("express").Router();
const authController = require("../controllers/authController");

route.get("/register", authController.renderRegistration);
route.get("/login", authController.renderLogin);
route.post("/register", authController.register);
route.post("/login", authController.login);
route.post("/logout", authController.logout);

module.exports = route;