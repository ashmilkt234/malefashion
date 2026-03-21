const User = require("../models/userSchema");

const attachUser = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.locals.user = null;
      return next();
    }
    const user = await User.findById(req.session.user).lean();
console.log("Middleware running, session user:", req.session.user);

    res.locals.user = user || null;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports=attachUser