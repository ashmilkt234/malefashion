const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const userController=require("../controllers/admin/userController")
const categoryController=require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const { userAuth, adminAuth } = require("../middleware/auth");
const nocache = require("nocache");

const uploads = require("../middleware/multerConfig"); 
  
// Admin Routes
router.get("/login", nocache(),adminController.loadLogin);
router.post("/login", nocache(),adminController.login);
router.get("/logout",adminController.logout)
router.get("/pageerror",adminController.errorpage)
/// dashboard 

router.get("/dashboard", adminAuth, adminController.loadDashboard);
router.get("/users", adminAuth, adminController.loadUsers);
router.get("/user", adminAuth, userController.userInfo);
router.get("/blockuser",adminAuth,userController.userBlocked)
router.get("/unblockuser",adminAuth,userController.userunBlocked)
router.post("/logout", adminAuth, adminController.logout);
router.post("/block/:userId", adminAuth, adminController.blockUser);
router.post("/unblock/:userId", adminAuth, adminController.unblockUser);

// Category Routes
router.get("/category", adminAuth, categoryController.categoryInfo); 
router.post("/addCategory", adminAuth, categoryController.addCategory);
router.post("/addCategoryOffer", adminAuth, categoryController.addCategoryOffer);
router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer);
router.get("/addCategory", adminAuth, categoryController.loadAddCategory)
router.get("/listCategory",adminAuth,categoryController.getListCategory)
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory)
router.get("/editCategory/:id",adminAuth,categoryController.loadEditCategory)
router.post("/editCategory/:id",adminAuth,categoryController.editCategory)

// Product
router.get("/addProduct",adminAuth,productController.getProductAddPage)
router.get("/product",adminAuth,productController.getProduct)
// router.post("/addProduct",adminAuth.uploads.array("images",3),productController.addProducts)
router.post("/addProduct",adminAuth,uploads.array("images",3),productController.addProducts)
router.get("/product",adminAuth,productController.getAllProducts)

module.exports = router;