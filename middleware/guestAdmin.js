
const adminGuest = (req, res, next) => {

    if (req.session.adminId&&req.session.isAdmin) {
        console.log("dasboard",req.session.adminId&&req.session.isAdmin)
        return res.redirect("/admin/dashboard");
    }

    next();
}

module.exports = adminGuest;
