const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema")
const PDFDocument = require('pdfkit');

const listOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) return res.redirect("/login");

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    let query = { userId };

    if (search) {
      query.orderID = { $regex: search, $options: "i" };
    }

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.productId", "productName productImage")
      .lean();

    // Safe cleanup
    orders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items = order.items.filter(item => item?.productId != null);
      }
    });

    const totalPages = Math.ceil(totalOrders / limit);
console.log("Search:", search);
    res.render("user/order", {
      orders,
      search,
      title: "My Orders",
      currentPage: page,
      totalPages    
      
    });

  } catch (error) {
    console.error('List orders error:', error);
    res.redirect('/cart?error=server');
  }
};

const orderDetail=async(req,res)=>{
    try {
        const order=await Order.findOne({_id:req.params.id,userId:req.session.user}).populate("items.productId").lean()
        if(!order) return res.redirect("/orders?error=notfound")
            res.render("user/order-detail",{order,title:"Order Detail"})
    } catch (error) {
        console.error('Order detail error:', error);
    res.redirect('/orders?error=server');
    }
}

const cancelOrder = async (req, res) => {
  try {

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.session.user
    })

    if (!order) {
      return res.json({ success:false, message:"Order not found" })
    }

    if (["Cancelled","Delivered","Returned"].includes(order.address.status)) {
      return res.json({ success:false, message:"Order cannot be cancelled" })
    }

    order.address.cancelReason = req.body.reason || ""

    order.address.status = "Cancelled"

    // restore stock
    for (let item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: item.quantity } }
      )
    }

    await order.save()

    res.json({
      success:true,
      message:"Order cancelled successfully"
    })

  } catch (error) {
    console.log(error)
    res.json({ success:false })
  }
}


const cancelItem=async(req,res)=>{
try {
    const{itemId}=req.body
    if(!itemId){
        return res.json({success:false,message:"Item ID required"})
    }
    const order=await Order.findOne({
        _id:req.params.id,
        userId:req.session.user
    })
    if(!order){
        return res.json({success:false,message:"order not found"})
    }
    if(["Cancelled","Delivered","Returned"].includes(order.address?.status)){
        return res.json({success:false,message:"order cannot be modified"})
    }
    const itemIndex=order.items.findIndex(i=>i._id.toString()===itemId)
if(itemIndex===-1){
    return res.json({success:false,message:"Item not found"})
}
const item=order.items[itemIndex]
await Product.findByIdAndUpdate(item.productId,{
    $inc:{quantity:item.quantity
    }
})
  order.items.splice(itemIndex, 1);

    order.subtotal = order.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

     order.tax = Math.round(order.subtotal * 0.05);
    order.totalAmount =
      order.subtotal + order.deliveryCharge + order.tax;

    if (order.items.length === 0) {
      order.address.status = "Cancelled";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Item cancelled successfully"
    });
} catch (error) {
     console.error("Cancel item error:", error);
    return res.json({
      success: false,
      message: "Something went wrong"
    });
  }
};

const returnOrder = async (req, res) => {
    try{
    const order=await Order.findOne({_id:req.params.id,userId:req.session.user})
    //check order validity
    if(!order||order.address?.status!=="Delivered"){
        return res.json({success:false,message:"Cannot return"})
    }
    //reason is mandatory
    if(!req.body.reason){
        return res.json({success:false,message:"Reason required"})
    }
    //update order field
    order.address.returnOrder=req.body.reason
order.address.status="Returned"
//restore productstore
for(let item of order.items){
    await Product.findByIdAndUpdate(item.productId,{
        $inc:{quantity:item.quantity}
    })
}
    await order.save() 
    res.json({ success: true });
}
catch(error){
    console.error("Return order error",error)
    res.json({success:false})
}
}


const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.session.user
    }).populate("items.productId");

    if (!order) return res.redirect("/orders?error=notfound");


    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 50
    const tax      = order.tax           || order.address?.tax            || 0;
    const total    = subtotal+delivery

    const orderStatus  = order.address?.status  || order.status  || "Pending";
    const paymentMethod = order.paymentMethod   || "COD";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order.orderID}.pdf`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);


    doc
      .fontSize(22)
      .text("My Store", 50, 40)
      .fontSize(10)
      .text("Kerala, India")
      .text("support@mystore.com");

    doc.fontSize(18).text("INVOICE", 450, 40);

    doc
      .fontSize(10)
      .text(`Invoice No: ${order.orderID}`, 450, 70)
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 450, 150);

    doc.moveDown(3);

    doc.fontSize(12).text("Bill To:", 50, 130);
    doc
      .fontSize(10)
      .text(order.address?.name  || "Customer", 50, 145)
      .text(order.address?.phone || "",          50, 160)
      .text(order.address?.city  || "",          50, 175);


    const tableTop = 220;
    doc
      .fontSize(11)
      .text("Product", 50,  tableTop)
      .text("Qty",     300, tableTop)
      .text("Price",   350, tableTop)
      .text("Total",   450, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();


    let position = tableTop + 30;

    order.items.forEach(item => {
      const product = item.productId;
      doc
        .fontSize(10)
        .text(product?.productName || "Product",       50,  position)
        .text(item.quantity.toString(),                300, position)
        .text(`Rs.${item.price}`,                      350, position)
        .text(`Rs.${item.price * item.quantity}`,      450, position);
      position += 25;
    });


    const totalsTop = position + 20;

    doc.moveTo(350, totalsTop - 10).lineTo(550, totalsTop - 10).stroke();

    doc
      .fontSize(11)
      .text(`Subtotal: Rs.${subtotal}`,  350, totalsTop)
      .text(`Delivery: Rs.${delivery}`,  350, totalsTop + 20)
      .text(`Tax:      Rs.${tax}`,       350, totalsTop + 40);

    doc
      .fontSize(13)
      .text(`Total: Rs.${total}`, 350, totalsTop + 70);


    doc
      .fontSize(10)
      .text(`Order Status:   ${orderStatus}`,   50, totalsTop + 20)  
      .text(`Payment Method: ${paymentMethod}`, 50, totalsTop + 40); 


    doc
      .fontSize(10)
      .text("Thank you for your purchase!", 50, 720, {
        align: "center",
        width: 500
      });

    doc.end();

  } catch (error) {
    console.error("Invoice error:", error);
    res.redirect("/orders?error=server");
  }
};
const orderSuccess = async (req,res)=>{
    try {

        res.render("user/order-success")

    } catch (error) {
        console.log(error)
    }
}


const placeOrder = async (req,res)=>{
    try {

        console.log("Place order controller working")
const cartItems = req.session.cart
const selectedAddress = req.session.address
        const order = new Order({
            userId:req.session.user,
            items:cartItems,
            address:selectedAddress
        })

        await order.save()

        console.log("Order saved")

        res.json({
            success:true
        })

    } catch (error) {
        console.log(error)
        res.json({
            success:false,
            message:"Order failed"
        })
    }
}
module.exports={listOrder,placeOrder,orderSuccess,cancelOrder,orderDetail,cancelItem,returnOrder,downloadInvoice}