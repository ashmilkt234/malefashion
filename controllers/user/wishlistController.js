const Wishlist=require("../../models/wishlistSchema")
const Cart=require("../../models/cartSchema")
const Product=require("../../models/productSchema")
const loadWishlist=async(req,res)=>{
    try{
        if(!req.session.user){
            return res.redirect("/login")
        }
      let  wishlist=await Wishlist.findOne({
            user_id:req.session.user
        }).populate({
        path: "products.productId",
        match: { isDeleted: false}
      })
      .lean();
      if(!wishlist){
        wishlist={products:[]}
      }
        else{
        wishlist.products=wishlist.products.filter(item=>item.productId!=null)
      }
        
        res.render("user/wishlist",{
            wishlist,
            currentpage:"wishlist"
        })
    }catch(error){
        console.log("load wishlist error",error)
    }
}
const addToWishlist=async(req,res)=>{
    try {
    const userId = req.session.user;
    const { productId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "Login required" });
    }

    const product = await Product.findById(productId);
    console.log("Product Found:", product);

 if (!product) {
  return res.json({ success: false, message: "Product not found" });
}

if (product.isBlocked) {
  return res.json({ success: false, message: "Product is blocked" });
}

if (product.isDeleted) {
  return res.json({ success: false, message: "Product is deleted" });
}

if (product.quantity <= 0) {
  return res.json({ success: false, message: "Out of stock" });
}


    let wishlist = await Wishlist.findOne({ user_id: userId })

    if (!wishlist) {
      wishlist = new Wishlist({
        user_id: userId,
        products: [{ productId }]
      });
    } else {
      const alreadyExists = wishlist.products.some(
        item => item.productId.toString() === productId
      );

      if (!alreadyExists) {
        wishlist.products.push({ productId });
      }
    }

    await wishlist.save();

    res.json({ success: true });

  } catch (error) {
    console.log("Add Wishlist Error:", error);
    res.json({ success: false });
  }
};


const removeFromWishlist=async(req,res)=>{
    try {

            const userId = req.session.user;
    const { productId } = req.body;

    await Wishlist.updateOne(
      { user_id: userId },
      { $pull: { products: { productId } } }
    );
      res.json({success:true})
    } catch (error) {
           console.log("Remove Wishlist Error:", error);
    res.json({ success: false });
    }
}

const moveToCart=async(req,res)=>{
    try {
        const userId=req.session.user
        const{productId}=req.body
        if(!userId){
            return res.json({success:false,message:"Login required"})
        }
        const product = await Product.findById(productId)
          if (!product || product.isDeleted || product.isBlocked || product.status !== "Available") {
      return res.json({ success: false, message: "Product not available" })
          }
          if(product.quantity<=0){
            return res.json({success:false,message:"product not available"})

          }
          let cart=await Cart.findOne({user_id:userId})
          if(!cart){
            cart=new Cart({
                user_id:userId,
                items:[{
                  productId: productId,
                    quantity:1
                }]
            })
          }
          else{
            if(!Array.isArray(cart.items)){
              cart.items=[]
            }
          }
           
 
  const existingItem = cart.items.find(
  item => item.product_id&& item.product_id.toString() === productId);

          if (existingItem) {
        if(existingItem.quantity>=product.quantity) {
          return res.json({success:false,
            message:"Stock limit reached"
          })
        }
        existingItem.quantity+=1
      } else {
        cart.items.push({
          product_id:productId,
          quantity: 1
        });
      }
        
  
//remove
//  wislish
    await cart.save()
const wishlist = await Wishlist.findOne({ user_id: userId })
if (wishlist) {
  wishlist.products = wishlist.products.filter(
    item => item.productId.toString() !== productId
  );
  await wishlist.save();
}
 res.json({ success: true })
    } catch (error) {
        console.log("Move to Cart Error",error)
        res.json({success:false})
    }
}


const getWishlistStatus = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ success: true, wishlistItems: [] });
    }

    const wishlist = await Wishlist.findOne({ user_id: req.session.user });

    if (!wishlist) {
      return res.json({ success: true, wishlistItems: [] });
    }
    const wishlistItems = wishlist.products.map(item => 
      item.productId.toString()
    )
     res.json({ success: true, wishlistItems });
  }
  catch (error) {
    console.log("Get wishlist status error:", error);
    res.json({ success: false, wishlistItems: [] });
  }
}

module.exports={loadWishlist,addToWishlist,getWishlistStatus,removeFromWishlist,moveToCart}