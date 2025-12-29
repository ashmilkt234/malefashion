// Middleware to prevent logged-in admins from accessing guest pages (like login)
const adminGuest = (req, res, next) => {
    // If admin is already logged in, redirect to dashboard
    if (req.session.adminId) {
        return res.redirect("/admin/dashboard");
    }
    // Otherwise, allow access to guest page
    next();
}

module.exports = adminGuest;
