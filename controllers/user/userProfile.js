// Import models
const User = require("../../models/userSchema");



// ================= User Profile =================
const getUserProfile = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Get user details
    const user = await User.findById(req.session.user.id);

    // If user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Render user profile page
    return res.render("user/userprofile", { user });
  } catch (error) {
    console.log("User profile error:", error);
    return res.redirect("/pageNotFound");
  }
};



// Export function
module.exports = {
  getUserProfile
};
