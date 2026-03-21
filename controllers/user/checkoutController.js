const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Address=require("../../models/addressSchema");
const { render } = require("ejs");

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("checkout session",userId)
    if (!userId) return res.redirect("/login");

    const cart = await Cart.findOne({ user_id: userId })
      .populate("items.product_id");
      console.log("cart",cart)

    if (!cart || cart.items.length === 0) {
      return res.redirect("/cart");
    }


const validItems = cart.items.filter(item => {
    if (!item.product_id) {
        console.log("Invalid: no product_id");
        return false;
    }
    const p = item.product_id;
    const stock=p.stock??9999
    console.log(`Item ${p.productName || p._id}: deleted=${p.isDeleted}, stock=${stock}, needed=${item.quantity}`);
    return !p.isDeleted && p.stock >= item.quantity;
});
    if (validItems.length === 0) {
      console.log("WAring no valid item");
      
    //   cart.items=[]
    //   await cart.save()
    // return res.redirect("/cart?error=no_valid_items")
    }

    let subtotal = 0;
    validItems.forEach(item => {
      subtotal += item.product_id.salesPrice * item.quantity;
    });
    console.log("validItems count:", validItems.length);

    const deliveryCharge = 50;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryCharge + tax;

    const addresses = await Address.find({ user_id: userId }).lean();
    console.log("About to render checkout",addresses);

console.log("subtotal:", subtotal)

    res.render("user/checkout", {
      cart: { ...cart.toObject(), items: validItems },
      subtotal: subtotal.toFixed(2),
      deliveryCharge: deliveryCharge.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      addresses,
      productDiscount: 0,
      totalDiscount: 0,
      title: "Checkout",
      errorMessage: validItems.length === 0 ? "No valid items available (out of stock or deleted)" : null
    });

  } catch (error) {
    console.error("Checkout error:", error);
    res.redirect("/cart?error=server_error");
  }
};
const proceedToPayment = async (req, res) => {
  try {
    const userId = req.session.user;
    const { selectedAddress } = req.body;

    console.log("[PROCEED] User ID:", userId);
    console.log("[PROCEED] Received selectedAddress:", selectedAddress);

    if (!userId) {
      return res.json({ success: false, message: "Please login" });
    }

    if (!selectedAddress) {
      return res.json({ success: false, message: "Please select an address" });
    }

    // Find address and verify ownership
    const address = await Address.findOne({
      _id: selectedAddress,
      user_id: userId
    });

    if (!address) {
      return res.json({ success: false, message: "Invalid or unauthorized address" });
    }

    // Save to session
    if (!req.session.checkout) {
      req.session.checkout = {};
    }
    req.session.checkout.selectedAddress = selectedAddress.toString();

    // Force save session (sometimes needed in some setups)
    req.session.save((err) => {
      if (err) console.error("Session save failed:", err);
    });

    console.log("[PROCEED] Session after save:", req.session.checkout);

    res.json({ success: true, render: "/payment" });
  } catch (error) {
    console.error("Proceed to payment error:", error);
    res.json({ success: false, message: "Something went wrong" });
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { comments } = req.body;
if (!userId) {
      return res.json({ success: false, message: "Please login" });
    }
  
    const checkout=req.session.checkout||{}
    if(!checkout.selectedAddress){
      return res.json({success:false,message:"No address selected"})
    }
    const address=await Address.findById(checkout.selectedAddress)
    if(!address){
      return res.json({success:false,message:"Invalid address"})
    }
    const cart = await Cart.findOne({ user_id: userId })
      .populate("items.product_id");

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Cart empty" });
    }

    let subtotal = 0;

    const orderItems = cart.items.map(item => {
      subtotal += item.product_id.salesPrice * item.quantity;
      return {
        productId: item.product_id._id,
        quantity: item.quantity,
        price: item.product_id.salesPrice
      };
    });

    const deliveryCharge = 50;
    const tax = Math.round(subtotal * 0.05);

    const totalAmount = subtotal + deliveryCharge + tax

    const orderAddress = {
      name:address.name,
      phone:address.phone,
      address_line: address.address_line,
      city: address.city,
      district: address.district,
      state: address.state,
      pincode: address.pincode,
      country: address.country
    };

    const newOrder = new Order({
      userId,
      items: orderItems,
      address: orderAddress,
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod:"cod",
      comments:comments||""
    });

    await newOrder.save();

    for (let item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product_id._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    cart.items = [];
    await cart.save();
    delete req.session.checkout

 res.json({
      success: true,
      message: "Order placed successfully with Cash on Delivery!",
      orderId: newOrder._id
    })

  } catch (error) {
   console.error("Place order error:", error);
    res.json({ success: false, message: "Something went wrong" });
  }
};


//paymentloadingpage
const getPaymentPage=async(req,res)=>{
  try {
    const userId=req.session.user
    if (!userId) return res.redirect("/login")
      
      const checkout=req.session.checkout||{};
      if(!checkout.selectedAddress){
        console.log("No address in session - redirecting to checkout");
        return res.redirect("/checkout?error=no_address_selected")
      }
      const address=await Address.findById(checkout.selectedAddress)
      if(!address){
        return res.redirect("/checkout?error=invalid_address")
      }
    const cart=await Cart.findOne({user_id:userId})
    .populate({
      path:"items.product_id"
    })
    if(!cart||cart.items.length===0){
      return res.redirect("/cart?error=cart_empty")

    }


    let subtotal=0
    cart.items.forEach(item=>{
      subtotal+=item.product_id.salesPrice*item.quantity
    })
   const deliveryCharge = 50;

    const total = subtotal + deliveryCharge

    res.render("user/payment", {
      subtotal: subtotal.toFixed(2),
      deliveryCharge: deliveryCharge.toFixed(2),
      total: total.toFixed(2),
      address,
      cartItems: cart.items,
      previewItem: cart.items[0]?.product_id || null,
      title: "Payment - Cash on Delivery"
    })
} catch (error) {
    console.error(error)
    res.redirect('/cart?error=something_went_wrong')
  }
}

module.exports={loadCheckout,placeOrder,
   getPaymentPage,proceedToPayment

}