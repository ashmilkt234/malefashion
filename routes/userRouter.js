const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const productControlleruser = require("../controllers/user/productControlleruser");
const isGuest = require("../middleware/isGuest");
const userProfile= require('../controllers/user/userProfile.js')
const passport = require("passport");
const userAuth = require("../middleware/userAuth");
const { checkBlocked, adminAuth } = require("../middleware/auth");




// Common pages
router.get("/",userController.loadHomepage);
router.get("/pageNotFound", userController.pageNotFound);
router.get("/error", userController.loadErrorPage);



// Signup / OTP flow
router.get("/signup",isGuest,userController.loadSignup);
router.post("/signup", userController.signup);
router.get("/verify-otp", userController.loadOtpPage);  
router.post("/verify-otp", userController.verifyotp);   
router.post("/resend-otp", userController.resendOtp)
router.get("/shop",userController.loadShopping)






// Google Auth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => { req.session.user=req.user;
    res.redirect("/")}
);




// Shop
router.get("/Shop", userController.loadShopping);


// Login / Logout
router.get("/login", isGuest,userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout", userController.logout);




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

module.exports = router;
