// Import models
const User = require("../../models/userSchema");

const bcrypt = require("bcrypt");


// ================= User Profile =================
const getUserProfile = async (req, res) => {
  try {

    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Get user details
    const user = await User.findById(req.session.user._id);
    console.log("session user",req.session.user)

    // If user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Render user profile page
    return res.render("user/userprofile", { user });
  } catch (error) {
    console.log("User profile error:", error);
    return res.redirect("/pageNotFound");
  }
};

const getchangepassword=async(req,res)=>{
  try {
    if(!req.session.user){
      return res.redirect("/login")
    }
    res.render("user/changepassword",{message:null})
  } catch (error) {
    console.log("error",error)
    return res.redirect("/pageNotFound")
  }
}
const postchangepassword=async(req,res)=>{
  try {
    const{oldPassword,newPassword}=req.body
    console.log("old",oldPassword)
   
    console.log("REQ BODY:", req.body);
if(!req.session.user){
  return res.redirect("/login")
}
    let userId=req.session.user._id
    let user=await User.findById(userId);
   
console.log("USER PASSWORD:", user.password)
    let match=await bcrypt.compare(oldPassword,user.password)
    if(!match){
      return res.render("user/changepassword",{message:"invalid old password"})
    } 

   const hashedPassword=await bcrypt.hash(newPassword,10)
   user.password= hashedPassword
   await user.save()
   return res.render("user/changepassword",{
    message:"Password changed Successfully"
   })
    }

   catch (error) {
        console.log("Change password error:", error);
    return res.redirect("/pageNotFound");
  }
}


module.exports = {
  getUserProfile,
  getchangepassword,
  postchangepassword
};
