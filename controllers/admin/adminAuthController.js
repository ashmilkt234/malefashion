const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

// Load Login Page
const loadLogin = async (req, res) => {
  try {
    if (req.session.adminId && req.session.isAdmin) {
      return res.redirect("/admin/dashboard");
    }

    res.render("admin/adminlogin", {
      message: req.query.message || null,
      email: null
    });
  } catch (error) {
    console.log("Admin login page error:", error);
    res.redirect("/admin/error?message=Login page error");
  }
};

// Handle Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, isAdmin: true,isBlocked:false });
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    req.session.adminId = admin._id;
    req.session.isAdmin = true;

    req.session.save(err => {
      if (err) {
        console.log("Session save error:", err);
        return res.json({ success: false, message: "Session error" });
      }
      res.json({ success: true, message: "Welcome Admin!" });
    });
  

  } catch (error) {
    console.log("Admin login error:", error);
    res.json({ success: false, message: "Login failed" });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) return res.json({ success: false });

      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  } catch (error) {
    res.json({ success: false });
  }
};

module.exports = { loadLogin,
     adminLogin,
      logout };
