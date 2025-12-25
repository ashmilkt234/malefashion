const User = require("../models/userSchema");

const blocked = async (req, res, next) => {
  try {
    if (!req.session.user) return next();

    const user = await User.findById(req.session.user);

    if (!user || user.isBlocked) {
      req.session.userId = null;
      return res.redirect("/login?error=blocked");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports=blocked