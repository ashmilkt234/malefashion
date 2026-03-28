const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3
    },

    description: {
      type: String,
      required: true,
      minlength: 10
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    
    salesPrice: {
      type: Number,
      required: true,
      min: 0
    },

    productOffer: {
      type: Number,
      default: 0
    },

    quantity: {
      type: Number,
      required: true,
      min:[0,"stock cannot be negative"]
    },

    productImage: {
      type: [String],
      required: true,
      validate: [arr => arr.length > 0, "At least one image required"]
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Discontinued"],
      default: "Available"
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
