const User = require("../models/userSchema");

// Middleware to protect admin routes
const adminAuth = async (req, res, next) => {
  try {
    //  Check if admin session exists
    if (!req.session.adminId || !req.session.isAdmin) {
      return res.redirect("/admin/login");
    }

    //  Get admin data from DB
    const admin = await User.findById(req.session.adminId);

    //  If admin doesn't exist or is blocked, destroy session and redirect
    if (!admin || admin.isBlocked) {
      req.session.destroy(() => {});
      return res.redirect("/admin/login");
    }

    //  Extra safety: check if user really has admin role
    if (!admin.isAdmin) {
      return res.redirect("/admin/login?error=Unauthorized");
    }

    //  Attach admin info to request for use in route handlers
    req.admin = admin;

    // 6Proceed to next middleware/route
    next();

  } catch (error) {
    console.log("Admin Auth Error:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = adminAuth;
