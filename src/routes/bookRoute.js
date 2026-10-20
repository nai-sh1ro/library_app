const route = require("express").Router();
const bookController = require("../controllers/bookController");

route.get("/", bookController.renderIndex);

module.exports = route;