const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const productControlleruser = require("../controllers/user/productControlleruser");
const userProfile= require('../controllers/user/userProfile.js');
const addressController=require("../controllers/user/addressController.js");
const authController=require("../controllers/user/authController.js");
const cartController=require("../controllers/user/cartController.js");
const wishlistController=require("../controllers/user/wishlistController.js");
const checkoutController=require("../controllers/user/checkoutController.js");
const orderController=require("../controllers/user/orderController.js");
const passport = require("passport");
const multerProfile=require("../middleware/multerProfile.js");

const guestAuth=require("../middleware/guestUserAuth.js");
const userAuth = require("../middleware/userAuth.js");
const blockCheck = require("../middleware/blockMiddleware.js");
const Address = require("../models/addressSchema.js");




router.get("/",userController.loadHomepage);
router.get("/pageNotFound", userController.pageNotFound);
router.get("/error", userController.loadErrorPage);



// Signup / OTP flow
router.get("/signup",guestAuth,userController.loadSignup);
router.post("/signup", userController.signup);
router.get("/verify-otp", userController.loadOtpPage);  
router.post("/verify-otp", userController.verifyotp);   
router.post("/resend-otp", userController.resendOtp)







// Google Auth
router.get("/auth/google", authController.googleLogin);
router.get(
  "/auth/google/callback",authController.googleCallback);




// Shop
router.get("/Shop",blockCheck, userController.loadShopping);


// Login / Logout
router.get("/login",guestAuth,userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout",userAuth, userController.logout);




// Forgot / Reset Password
router.get("/forgot-password",guestAuth, userController.loadForgotPassword);
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
router.post("/update",userProfile.updateProfile)
router.post("/verify-email-otp",userProfile.verifyEmailOtp);
router.post("/resend-email-otp", userProfile.resendEmailOtp);
router.get("/editProfile",userProfile.loadEditProfile)
router.get("/change-email",userProfile.getEmailChange)
router.post("/change-email",userProfile.postEmailChange);
// router.post("/update-email",userProfile.)
// router.post("/save-new-email",userProfile.saveNewEmail)
// router.post("/profile/update-email",userProfile.updateEmail)

//Address
router.get("/address", addressController.loadAddress);
router.post("/address/add", addressController.addAddress);
router.get("/address/edit/:id", addressController.editAddressPage);
router.post("/address/edit/:id", addressController.updateAddress);
router.post("/address/:id/delete", addressController.deleteAddress);
router.post("/address/:id/default", addressController.setDefaultAddress);


//Cart
router.get("/cart",cartController.loadCart);
router.post("/cart/add",cartController.addToCart);
router.post("/cart/remove",cartController.removeFromCart);
router.post("/cart/update",cartController.updateCartQuantity);



//wishlist
router.get("/wishlist",wishlistController.loadWishlist);
router.post("/add-to-wishlist",wishlistController.addToWishlist);
router.post("/remove-from-wishlist",wishlistController.removeFromWishlist);
router.get("/wishlist/status",wishlistController.getWishlistStatus);
router.post("/move-to-cart",wishlistController.moveToCart);

//checkout
router.get("/checkout",checkoutController.loadCheckout);
router.get("/payment",checkoutController.getPaymentPage);
// router.post("/apply-coupon",checkoutController.applyCoupon)
router.post("/place-order",checkoutController.placeOrder);
router.post('/checkout/proceed', checkoutController.proceedToPayment);

//order
router.get("/order",orderController.listOrder);
router.get("/order/:id",orderController.orderDetail);
router.post("/order/:id/cancel",orderController.cancelOrder);
router.post("/order/:id/cancel-item",orderController.cancelItem);
router.post("/order/:id/return",orderController.returnOrder);
router.get("/order/:id/invoice",orderController.downloadInvoice);
router.get("/order-success",orderController.orderSuccess);


//change username
router.get("/profile/change-username",userProfile.getChangeUsername);
router.post("/profile/change-username",userProfile.postChangeUsername);
router.post("/profile/verify-username-otp", userProfile.verifyUsernameOtp);
router.post("/profile/resend-username-otp", userProfile.resendUsernameOtp);


router.post("/profile/upload",multerProfile.single("profilePicture"),userProfile.uploadProfilePicture);
router.get('/profile/remove-photo', userProfile.removeProfilePhoto);

module.exports = router;
