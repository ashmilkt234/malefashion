const User = require('../models/userSchema');

const setUserData = async (req, res, next) => {
    // console.log("current req.user",req.user)
  try {
    if (req.user?._id) {
      const userData = await User.findById(req.user._id).lean();
      res.locals.user = userData;
      // console.log("user data set",userData)
    } else {
      res.locals.user = null;
      // console.log('No user ID in req.user');
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.locals.user = null;
  }
  next();
};

module.exports = setUserData;
