// Import models
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");
const multer = require("multer");



// ================= Category List =================
const categoryInfo = async (req, res) => {
    try {
    const search = req.query.search || "";

    // Pagination values
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    // Search query
    const query = {
      name: { $regex: search, $options: "i" }
    };

    const totalCategories = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalCategories / limit);

    res.render("admin/category", {
      categories,
      currentPage: page,
      totalPages,
      searchQuery: search
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};




// ================= Add Category =================
const addCategory = async (req, res) => {
  const { name, description } = req.body;

  try {
    // Check category exists
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    // Save new category
    const newCategory = new Category({ name, description });
    await newCategory.save();

    res.status(201).json({ message: "Category added successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= Add Category Offer =================
const addCategoryOffer = async (req, res) => {
  try {
    const percentage = parseInt(req.body.percentage);
    const categoryId = req.body.categoryId;

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    // Get products under category
    const products = await Product.find({ category: category._id });

    // Check higher product offer
    const hasHigherOffer = products.some(
      product => product.productOffer > percentage
    );

    if (hasHigherOffer) {
      return res.json({
        status: false,
        message: "Some products already have higher offer"
      });
    }

    // Update category offer
    await Category.updateOne(
      { _id: categoryId },
      { $set: { categoryOffer: percentage } }
    );

    // Update product prices
    for (const product of products) {
      product.productOffer = percentage;
      product.salesPrice = Math.floor(
        product.regularPrice - (product.regularPrice * percentage / 100)
      );
      await product.save();
    }

    res.json({ status: true, message: "Category offer added" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};



// ================= Remove Category Offer =================
const removeCategoryOffer = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.json({ status: false, message: "Category not found" });
    }

    const percentage = category.categoryOffer;

    // Get products
    const products = await Product.find({ category: category._id });

    // Reset product offers
    for (const product of products) {
      product.salesPrice += Math.floor(
        product.regularPrice * percentage / 100
      );
      product.productOffer = 0;
      await product.save();
    }

    // Reset category offer
    category.categoryOffer = 0;
    await category.save();

    res.json({ status: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false });
  }
};



// ================= Load Add Category Page =================
const loadAddCategory = (req, res) => {
  try {
    res.render("admin/addCategory");
  } catch (error) {
    res.status(500).send("Server Error");
  }
};



// ================= List Category =================
const getListCategory = async (req, res) => {
  try {
    await Category.updateOne(
      { _id: req.query.id },
      { $set: { isListed: true } }
    );
    res.redirect("/admin/category");
  } catch (error) {
    res.status(500).send("Server Error");
  }
};



// ================= Unlist Category =================
const getUnlistCategory = async (req, res) => {
  try {
    await Category.updateOne(
      { _id: req.query.id },
      { $set: { isListed: false } }
    );
    res.redirect("/admin/category");
  } catch (error) {
    res.status(500).send("Server Error");
  }
};



// ================= Load Edit Category =================
const loadEditCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send("Category not found");
 const categories = await Category.find();
    res.render("admin/editCategory", { category,categories });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};



// ================= Edit Category =================
const editCategory = async (req, res) => {


  
  
  try {
      console.log("REq Body",req.body);
    const { id } = req.params;
    const { name, description } = req.body;

    // Check duplicate category
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: new mongoose.Types.ObjectId(id) } 
    });

    if (existingCategory) {
     return res.status(400).json({
  success:false,
  message: "Category already exists"
});

    }

    // Update category
    await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

return res.status(200).json({
  success:true,
  message:"category updated successfully"
})

  } catch (error) {
    console.error(error);
    res.status(500).json({ success:false,error: "Server error" });
  }
};




module.exports = {
  categoryInfo,
  addCategory,
  addCategoryOffer,
  removeCategoryOffer,
  loadAddCategory,
  getListCategory,
  getUnlistCategory,
  loadEditCategory,
  editCategory
};
