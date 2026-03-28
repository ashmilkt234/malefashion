const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");

const loadOrders = async (req, res) => {
  try {
   const search=req.query.search||""; 
      const status  = req.query.status || "";
          const sort    = req.query.sort   || "latest";
const page= parseInt(req.query.page) || 1
const limit=10
const skip=(page-1)*limit
let query = {}
if(search){
  query.$or=[  { orderID: { $regex: search, $options: "i" } }
      ]
}
  if (status) {
      query["address.status"] = status;
    }

    const sortOrder = sort === "oldest" ? 1 : -1


const totalOrders=await Order.countDocuments(query)
const totalPages = Math.ceil(totalOrders / limit)
    const orders = await Order.find(query)
      .populate("userId", "name")   
      .populate("items.productId","productName") 
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)

  const filteredOrders = orders.filter(order =>
      order.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.orderID?.toLowerCase().includes(search.toLowerCase()) 
    );
    res.render("admin/order", { orders:filteredOrders,    currentPage: page,
      totalPages ,search,status,sort});
    

  } catch (error) {
    console.log("Order load error:", error);
    res.render("admin/order", { orders: [] ,currentPage: 1, 
      totalPages: 1, 
      search: "", 
      status: "", 
      sort: "latest"});
  }
};

const editOrderPage = async (req,res)=>{
  try{

    const order = await Order.findById(req.params.id).populate("userId", "name email")       
      .populate("items.productId", "productName salesPrice").lean()

    if(!order){
      return res.redirect("/admin/orders")
    }

    res.render("admin/editOrder",{order})

  }catch(error){
    console.log("Edit order error",error)
    res.redirect("/admin/orders")
  }
}

const updateOrder = async (req,res)=>{
  try{
 console.log("updateorder")
    console.log("Order update:", req.params.id)
await Order.findByIdAndUpdate(req.params.id, { "address.status": req.body.status });

    res.redirect("/admin/orders")

  }catch(error){
    console.log("Update order error:",error)
    res.redirect("/admin/orders")
  }
}

const cancelOrder = async (req, res) => {
  try {

    await Order.findByIdAndUpdate(
      req.params.id,
      { "address.status": "Cancelled" }
    )

    res.redirect("/admin/orders")

  } catch (error) {
    console.log("Cancel order error:", error)
    res.redirect("/admin/orders")
  }
}

const approveReturn = async (req, res) => {
  try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      for (let item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
              $inc: { quantity: item.quantity }
          });
      }

      order.address.status = "Returned";
      await order.save();

      res.redirect("/admin/orders");
  } catch (error) {
      console.error("Approve return error:", error);
      res.status(500).redirect("/admin/orders");
  }
};

const rejectReturn = async (req, res) => {
  try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      order.address.status = "Delivered"; // Revert status
      await order.save();

      res.redirect("/admin/orders");
  } catch (error) {
      console.error("Reject return error:", error);
      res.status(500).redirect("/admin/orders");
  }
};

module.exports = { loadOrders ,editOrderPage ,updateOrder,cancelOrder, approveReturn, rejectReturn };