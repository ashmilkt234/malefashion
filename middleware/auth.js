const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    req.user = data; // Attach user data to request for later use
                    next();
                } else {
                    req.session.destroy(err => {
                        if (err) console.log("Session destroy error:", err);
                        res.redirect("/login");
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

const adminAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && data.isAdmin) {
                    req.user = data; // Attach user data to request
                    next();
                } else {
                    req.session.destroy(err => {
                        if (err) console.log("Session destroy error:", err);
                        res.redirect("/admin/login");
                    });
                }
            })
            .catch(error => {
                console.log("Error in admin auth middleware:", error);
                res.status(500).send("Internal Server Error");
            });
    } else {
        res.redirect("/admin/login");
    }
};
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.render("admin/user", {
      message: "User has been blocked successfully",
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).render("admin/user", {
      error: "An error occurred while blocking the user",
    });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.render("admin/user", {
      message: "User has been unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).render("admin/user", {
      error: "An error occurred while unblocking the user",
    });
  }
};

   

module.exports = { adminAuth, userAuth ,unblockUser,blockUser};