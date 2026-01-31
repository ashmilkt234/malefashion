
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp"); // used for image resize




// ================= Add Product Page =================
const getProductAddPage = async (req, res) => {
  try {
    // Get all listed categories
    const category = await Category.find({ isListed: true });
    const stock = 0;

    // Render add product page
    res.render("admin/addProduct", { category, stock });
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};





// ================= Add New Product =================
const addProducts = async (req, res) => {
  try {
    const {
      productName,
      category,
      sizes,
      salesPrice,
      quantity,
      description
    } = req.body;

  
    if (Number(quantity) < 0) {
      return res.status(400).json({
        message: "Stock cannot be negative"
      });
    }

    // Duplicate product
    const productExists = await Product.findOne({
      productName: { $regex: `^${productName.trim()}$`, $options: "i" }
    });

    if (productExists) {
      return res.status(400).json({
        message: "Product already exists"
      });
    }

    // Categorycheck
    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }

    // Size 
    let sizesArray = [];
    if (categoryDoc.hasSize) {
      if (!sizes || sizes.length === 0) {
        return res.status(400).json({
          message: "Please select at least one size"
        });
      }
      sizesArray = Array.isArray(sizes) ? sizes : [sizes];
    }

    // Image
    let images = [];
    const uploadPath = path.join(__dirname, "../../public/uploads/product-images");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filename = `${Date.now()}-${file.originalname}`;

        await sharp(file.path)
          .resize(500, 500, { fit: "cover" })
          .jpeg({ quality: 90 })
          .toFile(path.join(uploadPath, filename));

        images.push(filename);
      }
    }


    const newProduct = new Product({
      productName,
      description,
      category: categoryDoc._id,
      sizes: sizesArray,
      salesPrice,
      quantity,
      productImage: images,
      status: "Available",
      createdOn: new Date()
    });

    await newProduct.save();

    return res.status(201).json({
      message: "Product added successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};



// ================= Product List with Search =================
const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
       const query = {};
// 
    // Find products by name
    const productData = await Product.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("category")
      .sort({createdAt:-1}) 
      .lean();

    // Count products
    const count = await Product.countDocuments(query);

    // Render page
    res.render("admin/product", {
      data: productData,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
 searchQuery: search,  
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};



// ================= Block Product =================
const blockProduct = async (req, res) => {
  try {
    // Block product
    await Product.updateOne(
      { _id: req.params.id },
      { $set: { isBlocked: true } }
    );

   return res.status(200).json({
    success:true,
    message:"Product blocked successfully"
   })

  } catch (error) {
    console.error(error)
    return res.status(500).json({success:false,message:"Failed to block product"})
  
  }
};




// ================= Unblock Product =================
const unblockProduct = async (req, res) => {
  try {
    // Unblock product
    await Product.updateOne(
      { _id: req.params.id },
      { $set: { isBlocked: false } }
    );

 return res.status(200).json({success:true, message:"Product unblocked successfully"})
  } catch (error) {
    console.error(error);
    
   return res.status(500).json({success:false, message:"Failed to unblocked product"})
  }
};



// ================= Edit Product Page =================
const getEditProduct = async (req, res) => {
  try {
    // Get product and categories
    const product = await Product.findById(req.params.id)
    .populate("category");
    const category = await Category.find();

    res.render("admin/editProduct", { product, category });
  } catch (error) {
    res.redirect("/pageerror");
  }
};



// ================= Update Product =================
const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    // Check duplicate product name
    const exists = await Product.findOne({
      productName: data.productName,
      _id: { $ne: id }
    });

    if (exists) {
      return res.status(400).json({ error: "Product already exists" });
    }

    // Find existing product
    const product = await Product.findById(id);
    if (!product) {
      return res.redirect("/pageerror");
    }

    const uploadPath = path.join(__dirname, "../../public/uploads/product-images");

    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    let finalImages = [...product.productImage]; // Start with existing images

    // Process up to 3 images 
    for (let i = 1; i <= 3; i++) {
      const croppedKey = `croppedImage${i}`;
      if (data[croppedKey] && data[croppedKey].startsWith("data:image")) {
        // Extract base64 data
        const base64Data = data[croppedKey].replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique filename
        const filename = Date.now() + `-${i}` + ".jpg";

        // Resize and save using sharp
        await sharp(buffer)
          .resize(500, 500, { fit: "cover" })
          .jpeg({ quality: 90 })
          .toFile(path.join(uploadPath, filename));

        // If there was an old image in this position
        if (finalImages[i - 1]) {
          const oldImagePath = path.join(uploadPath, finalImages[i - 1]);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

    
        finalImages[i - 1] = filename;
      }
      
    }

    const quantity=Number(data.quantity)
    if(quantity<0){
      return res.status(400).json({ error: "Stock cannot be negative" });
    }
    // Update product
    await Product.findByIdAndUpdate(id, {
      productName: data.productName,
      category: data.category,
      description: data.description,
      salesPrice: data.salesPrice,
      quantity: quantity,
      productImage: finalImages
    });

    return res.redirect("/admin/product?updated=true");
  } catch (error) {
    console.log("Edit Product Error =>", error);
    return res.redirect("/pageerror");
  }
};




// ================= Delete Single Image =================
const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer } = req.body;

    // Remove image from database
    const product=await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { productImage: imageNameToServer }
    });

    if(!product)return res.status(404).json({status:false, message:"Product not Found"})
    // Remove image from folder
    const imagePath = path.join(
      "public",
      "uploads",
      "product-images",
      imageNameToServer
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

 res.json({ status: true, message: "Image deleted successfully" });
  } catch (error) {
  console.error(error);
    res.status(500).json({ status: false, message: "Error deleting image" });
  }
};



///soft delete
const   softDelete=async (req,res)=>{
  try {
    await Product.findByIdAndUpdate(req.params.id,{
      isDeleted:true,
      deletedAt:new Date()
    })
 res.json({ status: true, message: "Product soft deleted" });

  } catch (error) {
 res.status(500).json({ status: false, message: "Soft delete error" });
  }
}
const restore=async(req,res)=>{
  try {
    console.log("Restore requested for ID:", req.params.id);
    await Product.findByIdAndUpdate(req.params.id,{
      isDeleted:false,
      deletedAt:null
    })
res.json({ status: true, message: "Product restored" });
  } catch (error) {
  res.status(500).json({ status: false, message: "Restore error" })
  }
}



const updatestock=async(req,res)=>{
  try {
    const{stock}=req.body
    if(stock<0){
      return res.status(400).json({success:false,message:"Stock cannnot be negative"})
    }
    const product=await  Product.findByIdAndUpdate(req.params.id,{quantity:stock},{new:true})
    if(!product){
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(404).json({ success: false, message: "Product not found" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  getProductAddPage,
  addProducts,
  getAllProducts,
  blockProduct,
  unblockProduct,
  getEditProduct,
  editProduct,
  deleteSingleImage,
  softDelete,
 restore,updatestock
};
