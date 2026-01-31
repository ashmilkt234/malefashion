const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const productControlleruser = require("../controllers/user/productControlleruser");
const userProfile= require('../controllers/user/userProfile.js')
const passport = require("passport");



const guestAuth=require("../middleware/guestUserAuth.js");
const userAuth = require("../middleware/userAuth.js");
const blockCheck = require("../middleware/blockMiddleware.js");



// Common pages
router.get("/",blockCheck,userController.loadHomepage);
router.get("/pageNotFound", userController.pageNotFound);
router.get("/error", userController.loadErrorPage);



// Signup / OTP flow
router.get("/signup",guestAuth,userController.loadSignup);
router.post("/signup", userController.signup);
router.get("/verify-otp", userController.loadOtpPage);  
router.post("/verify-otp", userController.verifyotp);   
router.post("/resend-otp", userController.resendOtp)







// Google Auth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => { req.session.user=req.user;
    res.redirect("/")}
);




// Shop
router.get("/Shop",blockCheck, userController.loadShopping);


// Login / Logout
router.get("/login",guestAuth,userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout",userAuth, userController.logout);




// Forgot / Reset Password
router.get("/forgot-password", userController.loadForgotPassword);
router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password", userController.loadResetPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/verify-forgot-otp", userController.verifyForgotOtp);
router.post("/auth/reset-password", userController.resetPassword);
// //product mangement
router.get("/productDetails/:id",productControlleruser.getProductDetailPage);


//userprofile


router.get("/userProfile",userProfile.getUserProfile)
router.get("/changepassword",userProfile.getchangepassword)
router.post("/changepassword",userProfile.postchangepassword)

module.exports = router;
