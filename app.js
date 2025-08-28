const express=require('express');
const { model } = require('mongoose');
const path=require("path")
const env=require("dotenv").config()
const session=require("express-session")

const passport=require("./config/passport.js")
const db=require("./config/db.js")
const nocache = require("nocache");
const setUserData = require("./middleware/setUserData.js");
const app=express()

const adminRouter=require("./routes/adminRouter.js")
const userRouter = require("./routes/userRouter.js")


//connect to database
db()
//Middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
   saveUninitialized: false,
  cookie:{
    secure:false,
    httpOnly:true,
    maxAge:72*60*60*1000

  }
}))
// app.use(locals)
app.use(nocache())
app.use(passport.initialize())
app.use(passport.session())
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use(express.static(path.join(__dirname, "public")));







//set View engine and view folder
app.set("view engine","ejs");
app.set("views", [
  path.join(__dirname, "views"),
]);



//Routes
app.use("/admin",adminRouter)
app.use("/",userRouter);

app.use(setUserData)

app.listen(process.env.PORT,()=>{
console.log(`Server Running on http://localhost:${3000}`);
})


module.exports=app;