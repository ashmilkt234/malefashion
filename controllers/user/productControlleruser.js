// Import models
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");




// ================= Product Details Page =================
const getProductDetailPage = async (req, res) => {
  try {
    // Get product id from URL
    const productId = req.params.id;
console.log("PRODUCT ID", productId);
    // Get active categories
    const categories = await Category.find({ status: "active" }).lean();

    // Get product details
    const productData = await Product.findById(productId).populate("category").lean();

    // If product not found
    if (!productData) {
      return res.status(404).send("Product not found");
    }
if(!productData.category){
  console.log('category for null',productId)
  return res.redirect("/shop")
}
console.log("PRODUCT CATEGORY", productData.category);
console.log("CATEGORY ID", productData.category._id)
    // Get related products from same category
    const relatedProducts = await Product.find({
      
      category: productData.category._id,
      _id: { $ne: productId } 
    })
    .populate("category")
      .limit(4)
      .sort({createdAt:-1})
      .lean();
      console.log("PRODUCT CATEGORY", productData.category);
console.log("TYPE", typeof productData.category);
console.log("realtd product",relatedProducts);
    // Breadcrumb data
    const breadcrumb = [
      { name: "Home", url: "/" },
      { name: "Shop", url: "/shop" },
      { name: productData.productName, url: `/product/${productId}` }
    ];


    // Render product details page
    res.render("user/productDetails", {
      product: productData,
      products: relatedProducts,
      salesPrice: productData.salesPrice,
      relatedProducts,
      breadcrumb,
      selectedCategory: productData.category,
      categories
    });

  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).send("error");
  }
};



// Export function
module.exports = {
  getProductDetailPage
};
