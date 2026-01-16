const loadDashboard = async (req, res) => {
  try {
    if (!req.session.adminId || !req.session.isAdmin) {
      return res.redirect("/admin/login");
    }

    res.render("admin/dashboard");
  } catch (error) {
    console.log("Dashboard error:", error);
    res.redirect("/admin/error?message=Dashboard error");
  }
};

module.exports = { loadDashboard };
