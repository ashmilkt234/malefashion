const category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

// Error Page
const pageerror = async (req, res) => {
    try {
        res.render("admin/pageerror", { message: req.query.message || "Page not found" });
    } catch (error) {
        console.log("Page error rendering:", error);
        res.status(500).send("Server error");
    }
};

// Login Page
const loadLogin = async (req, res) => {
    try {
        if (req.session.user && req.session.isAdmin) {
            return res.redirect("/admin/dashboard");
        }
        res.render("admin/adminlogin", { message: req.query.message ||null,email:null, });
    } catch (error) {
        console.log("Login page error:", error);
        res.redirect("/admin/error?message=Failed to load login page");
    }
};


// Handle Admin Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });

        if (!admin) {
            return res.render("admin/adminlogin", {
                message: "Admin not found",
                email,
            });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.render("admin/adminlogin", {
                message: "Incorrect password",
                email,
            });
        }

        req.session.user = admin._id;
        req.session.isAdmin = true;   // ✅ This was missing

        return res.redirect("/admin/dashboard");

    } catch (error) {
        console.log("Login error:", error);
        res.redirect("/admin/error?message=Login failed");
    }
};




// Admin Dashboard
const loadDashboard = async (req, res) => {
    try {
        if (req.session.user && req.session.isAdmin) {
        
            res.render("admin/dashboard");
          
        } else {
            res.redirect("/admin/login");
        }
    } catch (error) {
        console.log("Dashboard error:", error);
        res.redirect("/admin/error?message=Failed to load dashboard");
    }
};

// User Management
const loadUsers = async (req, res) => {
    try {
        const query = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of users per page
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments(); // Total users in DB
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find().skip(skip).limit(limit);

        res.render("admin/user", {
            data: users,
            message: req.query.message || null,
            totalPages: totalPages,
            currentPage: page,
             query:query
        });
    } catch (error) {
        console.log("Error loading users:", error);
        res.redirect("/admin/error?message=Failed to load users");
    }
};



const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId; // Changed from req.params.id to match router
        await User.findByIdAndUpdate(userId, { isBlocked: true });
        res.redirect("/admin/user?message=User has been blocked");
    } catch (error) {
        console.log("Error blocking user:", error);
        res.redirect("/admin/error?message=Failed to block user");
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.params.userId; // Changed from req.params.id to match router
        await User.findByIdAndUpdate(userId, { isBlocked: false });
        res.redirect("/admin/user?message=User has been unblocked");
    } catch (error) {
        console.log("Error unblocking user:", error);
        res.redirect("/admin/error?message=Failed to unblock user");
    }
};

// Logout
const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("Error destroying session:", err);
                return res.redirect("/admin/error?message=Failed to log out");
            }
            res.redirect("/admin/login");
        });
    } catch (error) {
        console.log("Unexpected error during logout:", error);
        res.redirect("/admin/error?message=Unexpected error during logout");
    }
};

const errorpage=(req,res)=>{
    res.render("admin/error")
}
module.exports = {
    pageerror,
    loadLogin,
    login,
    loadDashboard,
    loadUsers,
    blockUser,
    unblockUser,
    logout,
    errorpage,
}