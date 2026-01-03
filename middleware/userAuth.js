const User = require("../models/userSchema");

// Middleware to check if user is logged in and not blocked
const userAuth = async (req, res, next) => {
  try {
    // 1. Check if user session exists
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // 2. Fetch user from DB
    const user = await User.findById(req.session.user);

    // 3. If user doesn't exist or is blocked
    if (!user || user.isBlocked) {
      req.session.destroy()
      return res.redirect("/blocked");
    }

    // 4. Attach user to request for later use in routes
    req.user = user;
    next();
  } catch (error) {
    console.log("User Auth Error:", error);
    res.status(500).send("Server Error");
    res.redirect("/login");
  }
};

module.exports = userAuth;
