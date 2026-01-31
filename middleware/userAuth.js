const User = require("../models/userSchema");

const userAuth = async (req, res, next) => {
  if (!req.session.user) return res.redirect("/login");

  const user = await User.findById(req.session.user);

  if (!user || user.isBlocked) {
    req.session.destroy();
    return res.redirect("/login");
  }

  next();
};
 
module.exports = userAuth;
