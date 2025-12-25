const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const userController=require("../controllers/admin/userController")
const categoryController=require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const adminAuth=require("../middleware/adminAuth")
const guestAdmin=require("../middleware/guestAdmin")
const nocache = require("nocache");
const uploads = require("../middleware/multerConfig"); 



// ----------------- Admin Authentication -----------------
router.get("/login",guestAdmin,adminController.loadLogin);
router.post("/login",guestAdmin,nocache(),adminController.login);
router.get("/logout",adminAuth,adminController.logout)



// Error page
router.get("/pageerror",adminController.errorpage)



// ----------------- Dashboard -----------------
router.get("/dashboard",adminAuth, adminController.loadDashboard);


//  Users -----------------
router.get("/users", adminAuth, adminController.loadUsers);
router.get("/user", adminAuth, userController.userInfo);
router.get("/blockuser",adminAuth,userController.userBlocked)
router.get("/unblockuser",adminAuth,userController.userunBlocked)
router.post("/logout", adminAuth, adminController.logout);
router.post("/block/:userId", adminAuth, adminController.blockUser);
router.post("/unblock/:userId", adminAuth, adminController.unblockUser);


// ----------------- Categories -----------------
router.get("/category", adminAuth, categoryController.categoryInfo); 
router.post("/addCategory", adminAuth, categoryController.addCategory);
router.post("/addCategoryOffer", adminAuth, categoryController.addCategoryOffer);
router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer);
router.get("/addCategory", adminAuth, categoryController.loadAddCategory)
router.get("/listCategory",adminAuth,categoryController.getListCategory)
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory)


// ----------------- Products -----------------

router.get("/addProduct",adminAuth,productController.getProductAddPage)
router.get("/product/:id",adminAuth,productController.getProduct)
router.post("/addProduct",adminAuth,uploads.array("productImage",3),productController.addProducts)
router.get("/product",adminAuth,productController.getAllProducts)
router.get("/blockProduct",adminAuth,productController.blockProduct)
router.get("/unblockProduct",adminAuth,productController.unblockProduct)
router.get("/editProduct/:id",adminAuth,productController.getEditProduct)
router.post("/editProduct/:id",adminAuth,uploads.array("productImage",3),productController.editProduct)
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)



module.exports = router;