const { status } = require("init");
const Category = require("../../models/categorySchema");
const product=require("../../models/productSchema");


//category infro
const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit); 

        res.render("admin/Category", {
            categories: categoryData,       
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
      
        });

    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};


//addcategory
const addCategory = async (req, res) => {
    const { name, description } = req.body;

    try {
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const newCategory = new Category({ name, description });
        await newCategory.save();

        return res.status(201).json({ message: "Category added successfully" });

    } catch (error) {
        console.error("Error adding category:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



//addcategory offer
const addCategoryOffer=async (req,res)=>{
    try{
        const percentage=parseInt(req.body.percentage)
        const categoryId=req.body.categoryId
        const category=await Category.findById(categoryId)
        if(!category){
            return res.status(404).json({status:false,message:"Category not found"})
        }
        const products=await product.find({category:category._id})
   const hasHigherProductOffer = products.some(product => product.productOffer > percentage);

        if (hasHigherProductOffer) {
            return res.json({
                status: false,
                message: "Some products already have a higher product offer than this category offer"
            });
        }

        // Update category offer
        await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

        // Reset all product offers under this category and apply new price
        for (const product of products) {
            product.productOffer = percentage;
            product.salePrice = Math.floor(product.regularPrice - (product.regularPrice * (percentage / 100)));
            await product.save();
        }

        res.json({ status: true, message: "Category offer added successfully" });

    } catch (error) {
        console.error("Error in addCategoryOffer:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};


//remove categoryoffer
const Product = require('../../models/productSchema'); // ✅ Import Product model

const removeCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(500).json({ status: false, message: "Category not found" });
        }

        const percentage = category.categoryOffer;
        const products = await Product.find({ category: category._id });

        if (products.length > 0) {
            for (const product of products) {
                product.salePrice += Math.floor(product.regaularPrice * (percentage / 100));
                product.productOffer = 0;
                await product.save();
            }
        }

        category.categoryOffer = 0;
        await category.save();

        res.json({ status: true });
    } catch (error) {
        console.error("Error in removeCategoryOffer:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

//load addcategory


const loadAddCategory = (req, res) => {
    try {
        res.render("admin/addCategory");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};
const getListCategory = async (req, res) => {
  const categoryId = req.query.id;
  try {
    await Category.updateOne({ _id: categoryId }, { $set: { isListed: true } });
    res.redirect("/admin/category"); // Adjust this path based on your category listing page
  } catch (err) {
    console.error("Error while listing category:", err);
    res.status(500).send("Internal Server Error");
  }
};

const getUnlistCategory = async (req, res) => {
  const categoryId = req.query.id;
  try {
    await Category.updateOne({ _id: categoryId }, { $set: { isListed: false } });
    res.redirect("/admin/category"); // Adjust this too if needed
  } catch (err) {
    console.error("Error while unlisting category:", err);
    res.status(500).send("Internal Server Error");
  }
};



const loadEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categoryData = await Category.findById(categoryId);
    if (!categoryData) return res.status(404).send("Category not found");

    res.render("admin/editCategory", { category: categoryData });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


const editCategory=async(req,res)=>{
try{
    const{id}=req.params
    const{name:categoryName,description}=req.body

    const existingCategory=await Category.findOne({name:categoryName,_id:{$ne:id},})
 if(existingCategory){
    return res.status(400).json({error:"Category exists,please choose another name"})

 }
 const updateCategory=await Category.findByIdAndUpdate(id,{name:categoryName,description:description,
 },{new:true})
 
 if(updateCategory){
    res.redirect("/admin/category?updated=true")
 }else{
    res.status(404).json({error:"Category not found"})

}
}
catch(error){
    console.error("error updating category",error)
    res.status(500).json({error:"Internal server error"})
}
}


module.exports = {
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    loadAddCategory,
    getListCategory,getUnlistCategory,
    editCategory
    ,loadEditCategory 
}

