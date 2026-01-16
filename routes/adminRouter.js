const express = require("express");
const router = express.Router();

const adminDashboardController=require("../controllers/admin/adminDashboardController")
const adminUserController=require("../controllers/admin/adminUserController")
const adminAuthController=require("../controllers/admin/adminAuthController")
const adminErrorController=require("../controllers/admin/adminErrorController")

// const userController=require("../controllers/admin/userController")
const categoryController=require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const adminAuth=require("../middleware/adminAuth")
const guestAdmin=require("../middleware/guestAdmin")
const nocache = require("nocache");
const uploads = require("../middleware/multerConfig"); 
const multer=require("multer")
const upload=multer()


// ----------------- Admin Authentication -----------------
router.get("/login",guestAdmin,adminAuthController.loadLogin);
router.post("/login",guestAdmin,nocache(),adminAuthController.adminLogin);
router.get("/logout",adminAuth,adminAuthController.logout)



// Error page
router.get("/pageerror", adminErrorController.pageerror)



// ----------------- Dashboard -----------------
router.get("/dashboard",adminAuth, adminDashboardController.loadDashboard);


//  Users -----------------
router.get("/user", adminAuth, adminUserController.userInfo);
router.post("/user/:id/block", adminAuth, adminUserController.userBlocked);
router.post("/user/:id/unblock", adminAuth, adminUserController.userunBlocked);

router.post("/logout", adminAuth, adminAuthController.logout);


// ----------------- Categories -----------------
router.get("/category", adminAuth, categoryController.categoryInfo); 
router.post("/addCategory", adminAuth, categoryController.addCategory);
router.post("/addCategoryOffer", adminAuth, categoryController.addCategoryOffer);
router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer);
router.get("/addCategory", adminAuth, categoryController.loadAddCategory)
router.get("/listCategory",adminAuth,categoryController.getListCategory)
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory)
router.get("/edit/:id" ,adminAuth,categoryController.loadEditCategory);
router.post("/edit/:id",adminAuth,upload.none(),categoryController.editCategory)
router.post("/category/delete/:id",adminAuth,categoryController.softDeletecategory)
router.post("/category/restore/:id",adminAuth,categoryController.restorecategory)
// ----------------- Products -----------------

router.get("/addProduct",adminAuth,productController.getProductAddPage)
// router.get("/product/:id",adminAuth,productController.getProduct)
router.post("/addProduct",adminAuth,uploads.array("productImage",3),productController.addProducts)
router.get("/product",adminAuth,productController.getAllProducts)
router.get("/blockProduct",adminAuth,productController.blockProduct)
router.get("/unblockProduct",adminAuth,productController.unblockProduct)
router.get("/editProduct/:id",adminAuth,productController.getEditProduct)
router.post("/editProduct/:id",adminAuth,uploads.array("productImage",3),productController.editProduct)
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)

router.post("/product/delete/:id",adminAuth,productController.softDelete)
router.post("/product/restore/:id",adminAuth,productController.restore)


module.exports = router;