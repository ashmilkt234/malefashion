const User = require("../models/userSchema");

// check user login and block
const userAuth=async(req,res,next)=>{
    try {
if(!req.session.user){
    return res.redirect("/login")
}
const user=await User.findById(req.session.user)

if(!user||user.isBlocked){
    req.session.userId=null

return res.redirect("/login?message=Account blocked")
}
req.user=user
next()
    } catch (error) {
        console.log("User Auth Error",error);
        res.status(500).send("Server Error")
        
    }
}




module.exports = userAuth;
