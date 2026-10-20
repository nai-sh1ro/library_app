async function renderIndex(req, res) {
  res.status(200).render("book/index.ejs");
}

module.exports = {renderIndex};