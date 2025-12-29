const User = require('../models/userSchema');

// Middleware to set user data in response locals for templates
const setUserData = async (req, res, next) => {
  try {
    if (req.session.user) {
      // Fetch user info from DB using session user ID
      const userData = await User.findById(req.session.user).lean();

      // Make user data available in templates via res.locals
      res.locals.user = userData;
    } else {
      // No logged-in user
      res.locals.user = null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);

    // On error, clear user data
    res.locals.user = null;
  }
  
  // Continue to next middleware/route
  next();
};

module.exports = setUserData;
