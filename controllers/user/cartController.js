
const Cart = require('../../models/cartSchema.js');
const Product = require("../../models/productSchema.js");
const Wishlist=require("../../models/wishlistSchema.js")
const loadCart=async(req,res)=>{
try {
    if(!req.session.user){
        return res.redirect("/login")
    }
    let cart=await Cart.findOne({user_id:req.session.user}).populate("items.product_id")
    if(!cart){
        cart={items:[]};
    }
    ///remove deleted //blocked product
   let subtotal=0;
   cart.items.forEach(item=>{
    if(item.product_id){
        subtotal+=item.product_id.salesPrice*item.quantity
    }
   })
    res.render("user/cart",{
        cart,
        subtotal,
        currentPage:"cart"
    })
} catch (error) {
    console.log("load cart error",error)
    res.status(500).send("Server Error")
}
}
const addToCart=async(req,res)=>{
    try {
          if (!req.session.user) {
      return res.json({ success: false, message: "Login required"});
          }
          const userId=req.session.user
          const{productId,quantity}=req.body
          const qty=Number(quantity)||1
          const maxQty=5
console.log("User:", userId);
console.log("Product:", productId);

       const product=await Product.findById(productId).populate("category")

//product check
       if(!product||product.isDeleted){
        return res.json({success:false,message:"Product not available"})
       }


       if(product.isBlocked||!product.category.isListed){
        return res.json({ success: false, message: "Product unavailable"})
       }

       if (product.stock <= 0) {
      return res.json({ success: false, message: "Out of stock" });
    }
  if(qty>product.stock){
        return res.json({success:false,message:"Stock limit exceeded"})
    }

  if (qty > maxQty) {
      return res.json({ success: false, message: "Max 5 per product" });
    }
        if (product.isBlocked || !product.category.isListed) {
      return res.json({ success: false, message: "Product unavailable" })

    }
  

          let cart=await Cart.findOne({user_id:userId})
          //not have a cart create new
          if(!cart){
            cart=new Cart({
                user_id:userId,
                items:[
                    {product_id:productId,
                    
                        quantity:qty
                    }
                ]
            })
          }
          //if exits cart update in it
          else{
const itemsIndex=cart.items.findIndex(items=>items.product_id.toString()===productId)

if(itemsIndex>-1){
    const newQty=cart.items[itemsIndex].quantity+qty

    if(newQty>maxQty){
        return res.json({success:false,message:"Max 5 per product"})
    }

if(newQty>product.stock){
    return res.json({success:false,message:"Stock limit exceeded"})
}
cart.items[itemsIndex].quantity=newQty

}else{
    cart.items.push({
        product_id:productId,
        quantity:qty
    })
}
          }
          await cart.save()
          
         
        
          await Wishlist.updateOne(
      { user_id: userId },
      { $pull: { items: { product_id: productId } } }
    );
 res.json({success:true})
    } catch (error) {
        console.log("Add to cart error:", error)
    res.json({ success: false ,message:"Failed to addproduct"})
    }
}

const removeFromCart=async(req,res)=>{
try {
    const userId=req.session.user
    const{productId}=req.body
    await Cart.updateOne({ user_id:userId},{$pull:{items:{product_id:productId}}})
res.json({success:true})
    
} catch (error) {
     res.json({ success: false })
}
}

const updateCartQuantity = async (req, res) => {
  try {
    const { productId, action } = req.body;
    const userId = req.session.user;
const maxQty=5
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.json({ success: false });

    const item = cart.items.find(
      i => i.product_id.toString() === productId
    );

    if (!item) return res.json({ success: false });
const product=await Product.findById(productId)
if(!product){
    return res.json({success:false})
}
    if (action === "inc") {
    if(item.quantity>=product.stock){
        return res.json({success:false,message:"No more stock availabe"})
    }
    if(item.quantity>=maxQty){
        return res.json({success:false,message:"Max 5 allowed"})
    }
    item.quantity+=1
    } 
    else if (action === "dec" && item.quantity > 1) {
      item.quantity -= 1;
    }

    await cart.save();
    res.json({ success: true });

  } catch (error) {
    console.log("update cart qty error", error);
    res.json({ success: false });
  }
};
module.exports={loadCart,addToCart,removeFromCart,updateCartQuantity}