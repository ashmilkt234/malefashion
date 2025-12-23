const isAdmin=(req,res,next)=>{
    if(!res.session.user||req.session.isAdmin!==true){
        return res.redirect("/admin/login")
    }
    next()
}
module.exports=isAdmin;