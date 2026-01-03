// models/productSchema.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    description: {
    
      type: String,
      required: true,
    }
    ,
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
// size: {
//   type: [String], // or String, if only one size per product
//   required: true,
// },
    salesPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    productOffer: {
      // Fixed typo
      type: Number,
      default: 0,
    },
    quantity: {
      // Changed from quality to quantity
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    // color: {
    //   type: String,
    //   required: true,
    // },
    productImage: {
      type: [String], // Changed to array for multiple images
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Available", "out of stock", "Discontinued"], 
      required: true,
      default: "Available",
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;