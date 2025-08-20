const express=require('express');
const { model } = require('mongoose');
const path=require("path")
const env=require("dotenv").config()
const session=require("express-session")
const passport=require("./config/passport.js")
const db=require("./config/db.js")
const nocache = require("nocache");
const app=express()

const adminRouter=require("./routes/adminRouter.js")
const userRouter = require("./routes/userRouter.js")
// const setlocals=require("./middleware/setLocals.js")

//connect to database
db()
//Middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
   saveUninitialized: true,
  cookie:{
    secure:false,
    httpOnly:true,
    maxAge:72*60*60*1000

  }
}))
app.use(nocache())
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(path.join(__dirname, "public")));

app.use(express.static('public'));

//set View engine and view folder
app.set("view engine","ejs");
app.set("views", [
  path.join(__dirname, "views"),
]);



//Routes
app.use("/admin",adminRouter)
app.use("/",userRouter);

// app.use(setlocals)

app.listen(process.env.PORT,()=>{
console.log(`Server Running on http://localhost:${3000}`);

})


module.exports=app;