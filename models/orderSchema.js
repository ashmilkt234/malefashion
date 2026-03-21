const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderID: { type: String, unique: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price:Number,
  }],
  address:{
      name:String,
    phone:String,
    address_line:String,
    city:String,
    state:String,
    pincode:String,
subtotal:Number,
deliveryCharge:Number,
tax:Number,
totalAmount:Number,
paymentMethod:String,
status: { type: String, default: 'Pending', enum: ['Pending', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'] },
  cancelReason: String , 
  returnReason: String }, 
  createdAt: { type: Date, default: Date.now}});


orderSchema.pre('save',async function(next){
  if(this.isNew){
    const Counter=require("./counterSchema")
    const counter=await Counter.findOneAndUpdate({name:'order'},{$inc:{seq:1}},{upsert:true,new:true})
const year = new Date().getFullYear();
    this.orderID = `ORD${year}${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);