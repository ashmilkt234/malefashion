const User = require("../models/userSchema");

const blockCheck = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user);

      if (!user || user.isBlocked) {
        req.session.destroy();
        return res.render("user/blocked")
      }

      req.user = user;
    }

    next();
  } catch (error) {
    console.log("Block Check Error:", error);
    next();
  }
};

module.exports = blockCheck;
