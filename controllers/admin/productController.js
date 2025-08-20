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
        res.render("admin/addProduct",{category})
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



const addProducts=async(req,res)=>{
    try{
        const products=req.body
        console.log(products)
        const productExits=await Product.findOne({
productName:products.productName,
        })
        if(!productExits){
            const images=[];
            const productImageDir=path.join(__dirname,"../public/uploads/product-images")
            if(!fs.existsSync(productImageDir)){
              fs.mkdirSync(productImageDir,{recursive:true},(error)=>{
                if(error)throw error
              })

            }
            if(req.files&&req.files.length>0)
                {
                    for(let i=0;i<req.files.length;i++){
                        const originalImagePath=req.files[i].path
                    
 const ext = path.extname(req.files[i].originalname);
            const filename = Date.now() + "-" + i + ext;

            const resizedImagePath = path.join(productImageDir, filename);

            await sharp(originalImagePath)
                .resize({ width: 440, height: 440 })
                .toFile(resizedImagePath);

            images.push(filename);
            console.log("uploads files",req.files);
            
        }
    }
            
          
            const categoryId=await Category.findOne({name:products.category})
            if(!categoryId){
                return res.status(400).json("Invalid category name")
            }
            const newProduct=new Product({
                productName:products.productName,
                description:products.description,
                category:categoryId._id,
                salesPrice:products.salesPrice,
                createdOn:new Date(),
                quantity:products.quantity,
                size:products.size,
                color:products.color,
                productImage:images,
                status:'Available',
            })
    console.log("product data",newProduct)
            await newProduct.save()
        
            return res.redirect("/admin/addProduct")
        }else{
            return res.status(400).json("product already exists .plesae try with another name")
        }
    }catch(error){
console.error("Error saving product",error)
return res.redirect("/admin/pageerror")
    }
}
const getAllProducts = async (req, res) => {
  try {
    const search = req.body.search || "";
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

module.exports={getProductAddPage,getProduct,addProducts,getAllProducts}