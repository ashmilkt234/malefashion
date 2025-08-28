
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema"); 
const getProductDetailPage = async (req, res) => {
  try {
    const productId = req.params.id;  
  const categories = await Category.find({ status: "active" }).lean();
    const productData = await Product.findById(productId).lean()

    if (!productData) {
      return res.status(404).send("Product not found");
    }
  const relatedProducts = await Product.find({
      category: productData.category,
      _id: { $ne: productId }  
    }).limit(4).lean(); 
    
const breadcrumb = [
      { name: "Home", url: "/" },
      { name: "Shop", url: "/shop" },
      { name: productData.productName, url: `/product/${productId}` }
    ];

 
    return res.render("user/productDetails",
      {product:productData,products:relatedProducts,salesPrice:productData.salesPrice,  relatedProducts, breadcrumb,selectedCategory: productData.category  })
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).send("error");
  }
};

module.exports = {    
    getProductDetailPage
};

