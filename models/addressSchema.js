const mongoose=require("mongoose");
const { schema } = require("./userschema");
 const {Schema}=mongoose;
 const addressSchema=new Schema({
    userId:{
        type:schema.Types.Objectid,
        ref:"User",
        required:true
    },
    address:[{
        addressType:{
            type:String,
            required:true,
        },
        name:{
            type:String,
            required:true,
        },
        city:{
            type:string,
            required:true
        },
         landMark:{
            type:string,
            required:true
        }, state:{
            type:string,
            required:true
        }, pincode:{
            type:Number,
            required:true
        }, phone:{
            type:string,
            required:true
        },
         altphone:{
            type:string,
            required:true
        },



    }]
 })

 const Address=mongoose.model("Adress".addressSchema)
 module.exports=Address