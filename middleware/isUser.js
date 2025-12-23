const isUser=(req,res,next)=>{
    if(req.session.user||req.session.isAdmin===true){
        return res.redirect("/login")
    }
    next()
}
module.exports=isUser;