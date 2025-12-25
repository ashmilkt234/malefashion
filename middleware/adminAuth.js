const User = require("../models/userSchema");

const adminAuth = async (req, res, next) => {
  try {
    // 1. Check admin session
    if (!req.session.adminId || !req.session.isAdmin) {
      return res.redirect("/admin/login");
    }

    // 2. Find admin using adminId
    const admin = await User.findById(req.session.adminId);

    // 3. If admin not found or blocked
    if (!admin || admin.isBlocked) {
      req.session.destroy(() => {});
      return res.redirect("/admin/login");
    }

    // 4. Extra safety: role check
    if (!admin.isAdmin) {
      return res.redirect("/admin/login?error=Unauthorized");
    }

    // 5. Attach admin to request
    req.admin = admin;
    next();

  } catch (error) {
    console.log("Admin Auth Error:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = adminAuth;
