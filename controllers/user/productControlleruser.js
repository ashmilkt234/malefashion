const Category = require("../../models/categorySchema"); 
const Product = require("../../models/productSchema");
const getProductDetailPage = async (req, res) => {
  try {
    const productId = req.params.id;

    const categories = await Category.find({ isDeleted: false, isListed: true }).lean();

    const productData = await Product.findById(productId)
      .populate("category")
      .lean();

    //  Product not found or deleted
    if (!productData || productData.isDeleted) {
      return res.status(404).render("user/productUnavailable", {
        title: "Product Unavailable",
        message: "This product is no longer available."
      });
    }


    if (productData.isBlocked) {
      return res.status(403).render("user/productUnavailable", {
        title: "Product Blocked",
        message: "This product is temporarily blocked by admin."
      });
    }

 
    if (
      !productData.category ||
      productData.category.isDeleted ||
      !productData.category.isListed
    ) {
      return res.status(403).render("user/productUnavailable", {
        title: "Category Unavailable",
        message: "This product category is no longer available."
      });
    }

    // Related products
    const relatedProducts = await Product.find({
      category: productData.category._id,
      _id: { $ne: productId },
      isDeleted: false,
      isListed: true
    })
      .populate("category")
      .limit(4)
      .sort({ createdAt: -1 })
      .lean();

    const breadcrumb = [
      { name: "Home", url: "/" },
      { name: "Shop", url: "/shop" },
      { name: productData.productName, url: `/product/${productId}` }
    ];

    res.render("user/productDetails", {
      product: productData,
      relatedProducts,
      breadcrumb,
      selectedCategory: productData.category,
      categories,
      isBlocked: false
    });

  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).send("error");
  }
};
module.exports={getProductDetailPage}