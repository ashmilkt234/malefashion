const User = require("../models/userSchema");

const guestAuth = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user);

      // If blocked → destroy session
      if (!user || user.isBlocked) {
        req.session.destroy();
        return res.redirect("/login");
      }

      // Logged in & active user
      return res.redirect("/");
    }

    next();
  } catch (error) {
    console.log("Guest Auth Error:", error);
    req.session.destroy();
    res.redirect("/login");
  }
};

module.exports = guestAuth;
