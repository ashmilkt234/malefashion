const User = require("../models/userSchema");

const blockCheck = async (req, res, next) => {
  try {
    // Allow guests
    if (!req.session.user) {
      return next();
    }

    const user = await User.findById(req.session.user._id).lean();

    // User removed from DB
    if (!user) {
      return req.session.destroy(() => {
        res.redirect("/login");
      });
    }

    // User blocked by admin
    if (user.isBlocked) {
      return req.session.destroy(() => {
        res.render("user/blocked", {
          title: "Account Restricted"
        });
      });
    }

    //  user to request
    req.user = user;
    next();

  } catch (error) {
    console.error("Block Check Error:", error);
    next();
  }
};

module.exports = blockCheck;
