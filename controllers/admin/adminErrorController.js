const pageerror = (req, res) => {
  res.render("admin/pageerror", {
    message: req.query.message || "Page not found"
  });
};

module.exports = { pageerror };
