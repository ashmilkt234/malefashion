const express=require("express")
const router=express.Router()
const userController=require("../controllers/user/userController")
const passport = require("passport")
router.get("/pageNotFound",userController.pageNotFound)
router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.get("/shop",userController.loadShopping)
router.post("/signup",userController.signup)
router.post("/verify-otp",userController.verifyotp)
router.post("/verify-otp",userController.loadOtpPage)
router.post("/resend-otp",userController.resendOtp)
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get( "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }), (req, res) => {
    res.redirect("/");
  }
);
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.get("/logout",userController.logout)
router.get("/error",userController.loadErrorPage)

//forgot password
router.get("/forgot-password", userController.loadForgotPassword);
router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password", userController.loadResetPassword);
router.post("/reset-password", userController.resetPassword);


module.exports=router
