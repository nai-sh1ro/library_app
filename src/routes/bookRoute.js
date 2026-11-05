const route = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bookController = require("../controllers/bookController");

const uploadDir = path.join(__dirname, "../../public/uploads");
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
route.get("/books/create", bookController.renderCreate);
route.post("/books/isbn", bookController.getBookByISBN);
route.post("/books/create", upload.single("cover"), bookController.createBook);

module.exports = route;