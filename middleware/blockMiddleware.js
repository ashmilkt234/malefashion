const User = require("../models/userSchema");

// Middleware to check if a user is blocked
const blocked = async (req, res, next) => {
  try {
    //  If no user session, just continue
    if (!req.session.user) return next();

    //  Find user in database using session id
    const user = await User.findById(req.session.user);

    // If user doesn't exist or is blocked
    if (!user || user.isBlocked) {
      req.session.userId = null; // clear session
      return res.redirect("/login?error=blocked"); // redirect to login
    }

    // Attach user data to request for later use
    req.user = user;

    //  Continue to next middleware/route
    next();
  } catch (error) {
    next(error); // pass errors to error handler
  }
};

module.exports = blocked;
