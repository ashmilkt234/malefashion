const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },

    otp: {
      type: String, // hashed OTP
      required: true,
    },

    purpose: {
      type: String,
      enum: ["signup", "forgot-password"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
