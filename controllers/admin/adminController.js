// Import models and packages
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");


// ================= Error Page =================
const pageerror = async (req, res) => {
  try {
    // Render error page
    res.render("admin/pageerror", {
      message: req.query.message || "Page not found"
    });
  } catch (error) {
    console.log("Page error:", error);
    res.status(500).send("Server error");
  }
};



// ================= Load Admin Login Page =================
const loadLogin = async (req, res) => {
  try {
    // If admin already logged in
    if (req.session.adminId && req.session.isAdmin) {
      return res.redirect("/admin/dashboard");
    }

    // Render login page
    res.render("admin/adminlogin", {
      message: req.query.message || null,
      email: null
    });
  } catch (error) {
    console.log("Login page error:", error);
    res.redirect("/admin/error?message=Failed to load login page");
  }
};




// ================= Handle Admin Login =================
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin user
    const admin = await User.findOne({ email, isAdmin: true });
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    // Set admin session
    req.session.adminId = admin._id;
    req.session.isAdmin = true;

    res.json({ success: true, message: "Welcome Admin!" });
  } catch (error) {
    console.log("Admin login error:", error);
    res.json({ success: false, message: "Login failed" });
  }
};




// ================= Admin Dashboard =================
const loadDashboard = async (req, res) => {
  try {
    // Check admin login
    if (req.session.adminId && req.session.isAdmin) {
      res.render("admin/dashboard");
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("Dashboard error:", error);
    res.redirect("/admin/error?message=Failed to load dashboard");
  }
};




// ================= Load Users =================
const loadUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalUsers = await User.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .lean();

    res.render("admin/user", {
      users,
      search,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.log("Load users error:", error);
    res.redirect("/admin/error?message=Failed to load users");
  }
};




// ================= Block User =================
const blockUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Block user
    await User.findByIdAndUpdate(userId, { isBlocked: true });

   res.json({ success: true, message: "User blocked" });
  } catch (error) {

     res.status(500).json({ success: false });
  }
};




// ================= Unblock User =================
const unblockUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Unblock user
    await User.findByIdAndUpdate(userId, { isBlocked: false });

    res.json({ success: true, message: "User unblocked" });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};



// ================= Logout =================
const logout = async (req, res) => {
  try {
    // Destroy session
    req.session.destroy(err => {
      if (err) {
        return res.json({ success: false });
      }

      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  } catch (error) {
    res.json({ success: false });
  }
};




// ================= Error Page =================
const errorpage = (req, res) => {
  res.render("/error");
};



// ================= User Search =================
const userList = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const userData = await User.find({
            $or: [
               { name: { $regex: search, $options: "i" }},
               { email: { $regex: search, $options: "i" }}
            ]
        }).skip(skip).limit(limit);

        const totalUsers = await User.countDocuments({
            $or: [
                { name: { $regex: search, $options: "i" }},
                { email: { $regex: search, $options: "i" }}
            ]
        });

        res.render("admin/user", {
            users: userData,
            search: search,          // pass search value
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            limit
        });

    } catch (error) {
        console.log("User page error:", error);
        res.redirect("/admin/error");
    }
};



// Export functions
module.exports = {
  pageerror,
  loadLogin,
  adminLogin,
  loadDashboard,
  loadUsers,
  blockUser,
  unblockUser,
  logout,
  errorpage,
  userList
};
