const mongoose=require("mongoose");
// const { schema } = require("./userschema");
 const {Schema}=mongoose;
 const addressSchema=new Schema({
    user_id:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    phone:{
        type:String,
        required:false,
    },
    address_line:{
        type:String,
        required:true,
    },
    landmark:{
        type:String,
    },
    city:{
        type:String,
        required:true,
    },
    district:{
        type:String,
        required:true,
    },
    state:{
        type:String,
        required:true,
    },
    pincode:{
        type:String,
       required:true
    },
    
    country: {
      type: String,
      default: "India",
    },

    is_default: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


 const Address=mongoose.model("Address",addressSchema)
 module.exports=Address