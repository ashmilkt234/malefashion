const Product=require("../../models/productSchema")
const Category = require("../../models/categorySchema")
// const User = require("../../models/userSchema")
const fs=require("fs")
const path=require("path")
const sharp=require("sharp")//resize of images
const { search } = require("../../routes/adminRouter")
const { log } = require("console")


const getProductAddPage=async(req,res)=>{
    try {
        const category=await Category.find({isListed:true})
        const stock=0
        res.render("admin/addProduct",{category,stock})
    } catch (error) {
        console.error("error in getproductaddpage",error)
        res.redirect("/pageerror")
    }
}



const getProduct = async (req, res) => {
    try {
        const products = await Product.find().populate("category");
        res.render("admin/product", { data: products });
    } catch (error) {
        console.error("Error in getProduct:", error);
        res.render("admin/pageerror");
    }
};




 const addProducts = async (req, res) => {
  try {
    const products = req.body;
   

    const productExists = await Product.findOne({
      productName: { $regex: new RegExp("^" + products.productName + "$", "i") }
    });

    if (productExists) {
      return res.status(400).json("Product already exists. Please try another name.");
    }

    let images = [];
    const productImageDir = path.join(__dirname, "../../public/uploads/product-images");

    if (!fs.existsSync(productImageDir)) {
      fs.mkdirSync(productImageDir, { recursive: true });
    }

    // Use map to get filenames directly (no resizing)
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.filename);
    }

    const categoryId = await Category.findOne({ name: products.category });
    if (!categoryId) return res.status(400).json("Invalid category name");

    const newProduct = new Product({
      productName: products.productName,
      description: products.description,
      category: categoryId._id,
      salesPrice: products.salesPrice,
      createdOn: new Date(),
      quantity: products.quantity,
      size: products.size,
      color: products.color,
      productImage: images,
      status: 'Available',
    });

    console.log("product data", newProduct);
    await newProduct.save();
return res.redirect("/admin/addProduct?success=Product added successfully!");

  } catch (error) {
    console.error("Error saving product", error);
 return res.redirect("/admin/addProduct?error=Something went wrong!");
  }
};

const getAllProducts = async (req, res) => {
  try {
    const search = req.query?.search || "";
    console.log("req.query",req.query);
    console.log("req.session",req.session);
    
    const page = parseInt(req.query.page) || 1;
    const limit = 4;

    const productData = await Product.find({
      productName: { $regex: new RegExp(".*" + search + ".*", "i") }
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("category")
      .exec();

    const count = await Product.find({
      productName: { $regex: new RegExp(".*" + search + ".*", "i") }
    }).countDocuments();

    const category = await Category.find({ isListed: true });

    if (category) {
      res.render("admin/product", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalCount: count,
        category,
        search
       
      });
    } else{
        res.render("page-404")
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const blockProduct=async (req,res)=>{
  try{
    let id=req.query.id
    await Product.updateOne({_id:id},{$set:{isBlocked:true}})
    res.redirect("/admin/product")
  }
  catch(error){
    res.render("admin/pageerror")
  }
}
const unblockProduct=async(req,res)=>{
  try{
let id=req.query.id
await Product.updateOne({_id:id},{$set:{isBlocked:false}})
   res.redirect("/admin/product")

  }
  catch(error){
    res.render("admin/pagerror")
  }
}
const getEditProduct=async(req,res)=>{
  try {
    const id=req.params.id
    const product=await Product.findById(id)
    const category=await Category.find({})
    res.render("admin/editProduct",{product,category})
    
  } catch (error) {
    res.redirect('/pageerror')
  }
}
const editProduct=async(req,res)=>{
  try{
    const id=req.params.id;
      const data=req.body
         const existingProduct=await Product.findOne({
      productName:data.productName,
      _id:{$ne:id}
    
    })
       if(existingProduct){
      return res.status(400).json({error:"Product with thie name already exists.please try with another name"})
    }
      const images=[]
    if(req.files&&req.files.length>0){
      for(let i=0;i<req.files.length;i++){
        images.push(req.files[i].filename)
      }
    }
    const product=await Product.findOne({_id:id})
  
 
 
  
    
const updateFields={
  productName:data.productName,
  description:data.description,
  category:product.category,
  salesPrice:data.salesPrice,
  quantity:data.quantity,
  size:data.size,
  color:data.color

}


 if (images.length > 0) {
      await Product.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
          $push: { productImage: { $each: images } }
        },
        { new: true }
      );
    } else {
      await Product.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    }

    res.redirect("/admin/product");
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};




const deleteSingleImage=async(req,res)=>{
  const{imageNameToServer,productIdToServer}=req.body
await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}})
  const imagePath=path.join("public","uploads","product-images",imageNameToServer)
  if(fs.existsSync(imagePath)){
fs.unlinkSync(imagePath)
    console.log(`Image ${imageNameToServer}deleted`)
  }else{
    console.log(`Image ${imageNameToServer}not found`)
  }
  res.send({status:true})

  try {
    
  } catch (error) {
    res.redirect("/pageerror")
    
  }
}
module.exports={editProduct, getEditProduct,getProductAddPage,getProduct,addProducts,getAllProducts,blockProduct,unblockProduct,deleteSingleImage}