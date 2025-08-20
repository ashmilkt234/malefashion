const mongoose=require("mongoose")
const{schema}=mongoose
const couponSchema=new mongoose.Schema({
    name:{
        type:String,required:true,unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Date,required:true
    },
    offerprice:{
        type:Number,
        required:true
    },
    minimumprice:{
        type:Number,
        required:TextTrackCue
    },
    minimumprice:{
        type:Number,
        type:true
    },
    islist:{
        type:Boolean,
        default:true
    },
    userid:[{
        type:mongoose.Schema.Types.ObjectId,
        reg:'User'
    }]

})
const coupon=mongoose.model("Coupon",couponSchema)
module.exports=coupon