const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const getAddress = async (req, res) => {
    try {
  
        if (!req.user || !req.user._id) {
            console.log("User not authenticated");
            return res.redirect("/login");
        }
        

        const addresses = await Address.find({ user_id: req.user._id });
        
   
        res.render("user/address", { 
            addresses: addresses,
            user: req.user 
        });
    } catch (error) {
        console.log("address error", error);
        res.status(500).send("Error loading address: " ,error.message);
    }
}




const loadAddress=async(req,res)=>{
  try {
    const userData=await User.findById(req.session.user).lean()
    if(!userData){
      return res.redirect("/login")
    }
    const addresses=await Address.find({
      user_id:req.session.user
    }).lean()
    res.render("user/address",{
      currentPage:'address',
      user:userData,
  addresses:addresses
    })
   
  } catch (error) {
       console.log("Load address error:", error);
        res.status(500).send('Server Error');
  }
}


const addAddress=async(req,res)=>{
  try {
    const {
      first_name,
      last_name,
      phone,
      country,
      pincode,
      state,
      district,
      city,
      address_line,
      landmark,
      alternate_phone
    } = req.body;
  
        if (!district) {
      return res.status(400).send("District is required");
    }
await Address.create({
  user_id:req.session.user,
    first_name,
    last_name,
 name: `${first_name} ${last_name}`,
    phone,
    country,
    pincode,
    state,
    district,
    city,
    address_line,
    landmark,
    alternate_phone,
  userId: req.session.user,
   is_default: false
     
  });
   res.redirect('/address?success=1');
  } catch (error) {
   console.log("Add address error:", error);
   res.redirect("/address?error=1")
    res.status(500).send("Server error");
  
  }
}




//editAddressPage
const editAddressPage=async(req,res)=>{
  try {
  if(!req.session.user)return res.redirect("/login")
    const address=await Address.findOne({_id:req.params.id,user_id:req.session.user}).lean()
  if(!address){
    return res.redirect("/address")
  }
  res.render("user/editAddress",{address,currentPage:"address"})
  
  } catch (error) {
    console.log("Edit address page error",error)
    res.status(500).send("Server Error")

  }
}



//update Addresss
const updateAddress=async(req,res)=>{
  try {
    if(!req.session.user)return res.redirect("/login")

    const {
      first_name,
      last_name,
      phone,
      address_line,
      landmark,
      city,
      district,
      state,
      pincode,
      country
    } =req.body
    await Address.findOneAndUpdate({
      _id:req.params.id,
      user_id:req.session.user
    },{
name: `${first_name} ${last_name}`,
        phone,
        address_line,
        landmark,
        city,
        district,
        state,
        pincode,
        country
      
    },{new:true})
    return res.redirect("/address?updated=true")
  } catch (error) {
    console.log("Update address error",error)
    res.redirect('/address?updated=false')

  }
}


///delete Address
const deleteAddress = async (req, res) => {
  try {
    console.log("DELETE ROUTE HIT");
    console.log("Params:", req.params);
    console.log("Session full:", req.session);
    console.log("User from session:", req.session.user);

    const addressId = req.params.id;
    const userId = req.session.user;

    if (!userId) {
      console.log("No user in session → not logged in?");
      return res.redirect("/address?error=nouser");
    }

    if (!addressId) {
      console.log("No address ID in params");
      return res.redirect("/address?error=badid");
    }

    const address = await Address.findOne({
      _id: addressId,
      user_id: userId,
    });

    console.log("Found address:", address);

    if (!address) {
      console.log("Address not found or belongs to another user");
      return res.redirect("/address?error=notfound");
    }

    if (address.is_default) {
      const anotherDefault = await Address.findOne({
        user_id: userId,
        _id: { $ne: addressId },
        is_default: true,
      });

      console.log("Another default exists?", !!anotherDefault);

      if (!anotherDefault) {
        console.log("Cannot delete last default address");
        return res.redirect("/address?error=defaultDelete");
      }
    }

    const deleteResult = await Address.deleteOne({ _id: addressId });
    console.log("Delete result:", deleteResult);

    return res.redirect("/address?deleted=true");
  } catch (error) {
    console.error("DELETE ADDRESS FAILED:", error.stack || error.message);
    return res.redirect("/address?error=server");
  }
};

//setDefaultAddress

const setDefaultAddress=async(req,res)=>{
  try {
    const userId=req.session.user
const addressId=req.params.id
if(!userId){
  return res.redirect("/login")
}
//remove deafault all address of user
await Address.updateMany({user_id:userId},{$set:{is_default:false}})
await Address.findOneAndUpdate({_id:addressId,user_id:userId},{$set:{is_default:true}})
  res.redirect("/address")
    
  }
  catch(error){
    console.log("set default address error:", error)
     res.status(500).send("Server error")
  }
}
module.exports = { getAddress ,loadAddress,addAddress,editAddressPage,updateAddress,deleteAddress,setDefaultAddress};