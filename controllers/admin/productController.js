
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
    const products = req.body;
console.log("REQ BODY:", req.body);

    // Check if product already exists
    const productExists = await Product.findOne({
      productName: { $regex: new RegExp("^" + products.productName + "$", "i") }
    });

    if (productExists) {
      return res.status(400).json("Product already exists");
    }

    // Store uploaded images
    let images = [];
    const uploadPath = path.join(__dirname, "../../public/uploads/product-images");

    // Create folder if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Save image names
    if (req.files && req.files.length > 0) {
      for(let file of req.files){
        const filename=Date.now()+"-"+file.originalname
          // Resize/crop image to 500x500
        await sharp(file.path)
          .resize(500, 500, { fit: "cover" }) // crops to square
          .jpeg({ quality: 90 })
          .toFile(path.join(uploadPath, filename));

        images.push(filename);
        console.log(images)
      }
      
    }

    // Get category ID
    const categoryId = await Category.findOne({ name: products.category });
    if (!categoryId) return res.status(400).json("Invalid category");


    //size 

    let sizesArray=[]
    if(categoryId.hasSize){
      if(!products.sizes||products.sizes.length===0){
        return res.redirect("/admin/addProduct?error=Please select at least one size")
      
      }
      sizesArray=Array.isArray(products.sizes)?products.sizes:[products.sizes]
    }

    // Create product object
    const newProduct = new Product({
      productName: products.productName,
      description: products.description,
      category: categoryId._id,
      sizes: sizesArray,
      salesPrice: products.salesPrice,
      quantity: Number(products.quantity),
      productImage: images,
      status: "Available",
      createdOn: new Date(),
    });
console.log("FINAL SIZES:", sizesArray);

    // Save product
    await newProduct.save();

    res.redirect("/admin/addProduct?success=Product added");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/addProduct?error=Something went wrong");
  }
};




// ================= Product List with Search =================
const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
   const query = {
      productName: { $regex: search, $options: "i" }
 
    };
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
      { _id: req.query.id },
      { $set: { isBlocked: true } }
    );

    res.redirect("/admin/product");
  } catch (error) {
    res.render("admin/pageerror");
  }
};




// ================= Unblock Product =================
const unblockProduct = async (req, res) => {
  try {
    // Unblock product
    await Product.updateOne(
      { _id: req.query.id },
      { $set: { isBlocked: false } }
    );

    res.redirect("/admin/product");
  } catch (error) {
    res.render("admin/pageerror");
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

        // If there was an old image in this position, delete it
        if (finalImages[i - 1]) {
          const oldImagePath = path.join(uploadPath, finalImages[i - 1]);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

    
        finalImages[i - 1] = filename;
      }
      
    }

    // Update product
    await Product.findByIdAndUpdate(id, {
      productName: data.productName,
      category: data.category,
      description: data.description,
      salesPrice: data.salesPrice,
      quantity: Number(data.quantity),
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
    await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { productImage: imageNameToServer }
    });

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

    res.send({ status: true });
  } catch (error) {
    res.redirect("/pageerror");
  }
};



///soft delete
const     softDelete=async (req,res)=>{
  try {
    await Product.findByIdAndUpdate(req.params.id,{
      isDeleted:true,
      deletedAt:new Date()
    })
    res.redirect("/admin/product")

  } catch (error) {
  res.send("softDelete error",error)
  }
}
const restore=async(req,res)=>{
  try {
    await Product.findByIdAndUpdate(req.params.id,{
      isDeleted:false,
      deletedAt:null
    })
    res.redirect('/admin/product')
  } catch (error) {
    res.send("Resore error",error)
  }
}

// Export functions
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
 restore
};
