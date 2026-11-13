const route = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bookController = require("../controllers/bookController");

const uploadDir = path.join(__dirname, "../data/covers");
fs.mkdirSync(uploadDir, { recursive: true });

const extensionsByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/jfif": ".jfif"
};

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) => {
      const extension = extensionsByMimeType[file.mimetype];

      if (!extension) {
        return callback(new Error("Поддерживаются только JPEG, PNG, WebP и GIF"), "");
      }

      callback(null, `${require("crypto").randomUUID()}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    callback(null, Boolean(extensionsByMimeType[file.mimetype]));
  }
});

route.get("/", bookController.renderIndex);
route.get("/books", bookController.renderBooks);
route.get("/books/create", bookController.renderCreate);
route.post("/books/isbn", bookController.getBookByISBN);
route.post("/books/create", upload.single("cover"), bookController.createBook);
route.patch("/books/:id/status", bookController.updateBookStatus);
route.get("/books/:id/cover", bookController.getIMG);
route.delete("/books/:id/delete", bookController.deleteBook);
route.get("/books/add", bookController.renderAdd);
route.post("/books/:id/add", bookController.addBook);

module.exports = route;