// Import models
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");




// ================= Product Details Page =================
const getProductDetailPage = async (req, res) => {
  try {
    // Get product id from URL
    const productId = req.params.id;

    // Get active categories
    const categories = await Category.find({ status: "active" }).lean();

    // Get product details
    const productData = await Product.findById(productId).lean();

    // If product not found
    if (!productData) {
      return res.status(404).send("Product not found");
    }

    // Get related products from same category
    const relatedProducts = await Product.find({
      category: productData.category,
      _id: { $ne: productId } // exclude current product
    })
      .limit(4)
      .lean();

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
      selectedCategory: productData.category
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
