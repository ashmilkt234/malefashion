const User = require("../models/userSchema");

//  Normal User Auth
const userAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    req.user = data;
                    next();
                } else {
                    req.session.destroy(err => {
                        if (err) console.log("Session destroy error:", err);
                        res.redirect("/login?message=Your account is blocked");
                    });
                }
            })
            .catch(error => {
                console.log("Error in user auth middleware:", error);
                res.status(500).send("Internal Server Error");
            });
    } else {
        res.redirect("/login");
    }
};


//  Blocked check for every logged user
const checkBlocked = async (req, res, next) => {
    try {
        if (!req.session.user) return next();

        const currentUser = await User.findById(req.session.user);

        if (currentUser && currentUser.isBlocked) {
            req.session.destroy(() => {});
            return res.redirect('/login?message=Your account has been blocked');
        }
        next();

    } catch (error) {
        console.log("Error during block check:", error);
        res.status(500).send("Internal Server Error");
    }
};


// Admin Auth + Google User Block
const adminAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect("/admin/login");
        }

        const adminUser = await User.findById(req.session.user);

        // Block invalid users
        if (!adminUser || adminUser.isBlocked) {
            req.session.destroy(() => {});
            return res.redirect("/admin/login?error=You are blocked");
        }

        // Block Google users from Admin
        if (adminUser.isGoogleUser) {
            req.session.destroy(() => {});
            return res.redirect("/login?error=Google users cannot access Admin Panel");
        }

        // Only allow admin
        if (!adminUser.isAdmin) {
            req.session.destroy(() => {});
            return res.redirect("/login?error=Unauthorized Access");
        }

        req.user = adminUser;
        next();

    } catch (error) {
        console.log("Error in admin auth middleware:", error);
        res.status(500).send("Internal Server Error");
    }
};


//  Block & Unblock Controller
const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isBlocked: true },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        res.redirect("/admin/users?message=User blocked");
    } catch (error) {
        console.error("Error blocking user:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isBlocked: false },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        res.redirect("/admin/users?message=User unblocked");
    } catch (error) {
        console.error("Error unblocking user:", error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { adminAuth, userAuth, unblockUser, blockUser, checkBlocked };
