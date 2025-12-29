// Import user model
const User = require("../../models/userSchema.js");



// ================= Get Users List =================
const userInfo = async (req, res) => {
  try {
    // Get search value from query
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    // Get page number from query
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 3; // Users per page

    // Find non-admin users with search
    const userData = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } }
      ],
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Count total users
    const count = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } }
      ],
    }).countDocuments();

    // Render users page
    res.render("admin/user", {
      data: userData,
      message: req.query.message || null,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      query: search
    });

  } catch (error) {
    res.redirect("/pageerror");
  }
};



// ================= Block User =================
const userBlocked = async (req, res) => {
  try {
    // Get user id from query
    let id = req.query.id;

    // Block user
    await User.updateOne(
      { _id: id },
      { $set: { isBlocked: true } }
    );

    res.redirect("/admin/users");
  } catch (error) {
    res.redirect("/pageerror");
  }
};




// ================= Unblock User =================
const userunBlocked = async (req, res) => {
  try {
    // Get user id from query
    let id = req.query.id;

    // Unblock user
    await User.updateOne(
      { _id: id },
      { $set: { isBlocked: false } }
    );

    res.redirect("/admin/users");
  } catch (error) {
    res.redirect("/pageerror");
  }
};

// Export functions
module.exports = {
  userInfo,
  userBlocked,
  userunBlocked
};
