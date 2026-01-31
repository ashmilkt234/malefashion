const Product = require("../models/productSchema");

const productAccessCheck = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category");

    if (!product) {
      return res.render("user/productUnavailable", {
        title: "Product Not Found",
        message: "This product does not exist."
      });
    }

    if (
      product.isDeleted ||
      !product.isListed ||
      product.category.isDeleted ||
      !product.category.isListed
    ) {
      return res.render("user/productUnavailable", {
        title: "Product Unavailable",
        message: "This product is currently unavailable."
      });
    }

    req.product = product;
    next();
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};

module.exports = productAccessCheck;
