const mongoose=require("mongoose")
const{Schema}=mongoose;
const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    hasSize:{
        type: Boolean,
        default:false
    },
         allowedSizes: {
      type: [String],
      default: []
    
    }
    ,
    isDeleted: {
  type: Boolean,
  default: false
}
,
    categoryOffer:{
        type:Number,
        default:0
    }
},{
    timestamps:true

    
})
const category=mongoose.model("Category",categorySchema)
module.exports=category