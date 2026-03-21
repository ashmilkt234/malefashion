const Product = require("../../models/productSchema");
const loadInventory = async (req,res)=>{
    try {
        const products= await Product.find({ isDeleted: false }).populate("category","name").lean()
        const totalproduct=products.length
        const lowstock=products.filter(p=>p.quantity>0&&p.quantity<=5).length
        const outOfStock=products.filter(p=>p.quantity===0).length
        const history = req.session.inventoryHistory || []
            res.render("admin/inventory", {
      products,
totalproduct,
      lowstock,
      outOfStock,
      history
    })
        } catch (error) {       
         console.log("Load inventory error:", error);
    res.redirect("admin/dashboard")
    }
}
const adjustStock=async(req,res)=>{
    try {
        const { productId, action } = req.body
           const product = await Product.findById(productId)
           if (!product) return res.json({ success: false, message: "Product not found" })
            if(action==='inc'){
                product.quantity+=1
            }
            else if(action==='dec'&&product.quantity>0){
                product.quantity-=1
            }
            await product.save()
            if(!req.session.inventoryHistory){
                req.session.inventoryHistory=[]
            }
                req.session.inventoryHistory.unshift({productName:product.productName,
                    action:"Admin Overwrite",stock:product.quantity,
                    time:new Date().toLocaleDateString()
                })
                req.session.inventoryHistory=req.session.inventoryHistory.slice(0,10)
                res.json({success:true,stock:product.quantity})
            


    } catch (error) {
        console.log("Adjust stock error:", error);
    res.json({ success: false });
}
    } 
module.exports={loadInventory,adjustStock}