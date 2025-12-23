const User = require("../../models/userSchema")
const Product = require('../../models/productSchema')
const getUserProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.render("user/userprofile",{user});  // << Required
  } catch (error) {
    console.log("Error loading User profile page", error);
    return res.redirect("/pageNotFound");
  }
};
module.exports={getUserProfile}