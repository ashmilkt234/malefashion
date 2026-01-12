const adminAuth=(req,res,next)=>{
  if(req.session.adminId&&req.session.isAdmin){
    console.log(req.session.adminId,req.session.isAdmin)
    next()
  }else{
    res.redirect("/admin/login")
  }
}
module.exports=adminAuth