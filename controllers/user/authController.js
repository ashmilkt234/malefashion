const passport=require("passport")
const googleLogin=passport.authenticate("google",{
    scope:["profile","email"],
})
const googleCallback=[passport.authenticate("google",{failureRedirect:"/signup"}),
(req,res)=>{
req.session.user=req.user?._id
    res.redirect("/")
}]

module.exports={googleLogin,googleCallback}