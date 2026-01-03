// userController.js
const User = require("../../models/userSchema.js");
const Category=require('../../models/categorySchema')
const Product=require("../../models/productSchema")
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// //  Generate OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

//  Send OTP Email
async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: process.env.EMAIL_PORT||587,
            secure: false,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

//404
const pageNotFound = async (req, res) => {
    try {
        res.render("page_404");
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

// Homepage
// controller
const loadHomepage = async (req, res) => {
  try {

    const categories = await Category.find({ isListed: true }).lean();


    const productData = await Product.find({
      isBlocked: false,
      category: { $in: categories.map(c => c._id) },
      quantity: { $gt: 0 },
    })
      .sort({ createdAt: -1 })  
      .limit(4)
      .lean();

 
    const userId =
      req.session?.user?._id ||
      req.session?.user?.id ||
      req.session?.user || null;

    if (userId) {
      const userData = await User.findById(userId).lean();
      if (!userData) {
        return res.render("user/error", { message: "User not found" });
      }
      return res.render("user/home", {
        user: userData,
        products: productData,
        categories    
      });
    }

    return res.render("user/home", {
      products: productData,
      categories,           
    });
  } catch (error) {
    console.error("Homepage load error:", error);
    return res.render("user/error", { message: "Server error" });
  }
};

 




//  Shopping
const loadShopping = async (req, res) => {
    try {
        const{category,sort,page=1,minPrice,maxPrice,search}=req.query;
        const limit=8
        const skip=(page-1)*limit
        let filter={isBlocked:false,quantity:{$gt:0}}
        if(search){
            filter.productName={$regex:search,$options:"i"}
        }
if(category){
    filter.category=category
}
if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }
let sortOption = { createdAt: -1 }; // default: latest
    if (sort === "lowtohigh") {
      sortOption = { salePrice: 1 };
    } else if (sort === "hightolow") {
      sortOption = { salePrice: -1 };
    } else if (sort === "latest") {
      sortOption = { createdAt: -1 };
    }
const totalproducts=await Product.countDocuments(filter)

   const products = await Product.find(filter)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)

const categories = await Category.find({ isListed: true });

               res.render('user/shop', {
            user: req.session.user || null,
            products: products || [], 
            categories: categories || [],
             selectedCategory: category || null, 
             sort:sort||"",
             currentPage:parseInt(page),
             totalPages:Math.ceil(totalproducts/limit),
                      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      search: search || "",
            title: 'Shop - Men\'s Fashion',
              breadcrumb: [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    category ? { name: categories.find(c => c._id.toString() === category)?.name, url: "#" } : null
  ].filter(Boolean) // remove null if no category
});
     
  

    } catch (error) {
        console.log("Shopping page error", error);
        res.status(500).send("Server Error");
        res.render('user/shop', {
            user: req.session.user || null,
            products: [],  
            categories: [],
        
            title: 'Shop - Men\'s Fashion',
            error: 'Unable to load products at this time.'
        });
    }
};






//  Signup
const loadSignup = async (req, res) => {
    try {
        return res.render("user/signup", {
      blocked: req.query.blocked});
    } catch (error) {
        console.log("Signup page error", error);
        res.status(500).send("Server Error");
    }
};

//  Signup
const signup = async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;
    console.log(req.body)

    if (password !== confirmPassword) {
        return res.render("user/signup", { message: "Passwords do not match" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
        return res.render("user/signup", { message: "User with this email already exists" });
    }

    try {
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.json({ success: false, message: "Email sending failed" });
        }
 // Store signup info & OTP in session
        req.session.userOtp = otp;
        console.log("session otp is vefity",req.session.userOtp)
        req.session.userData = { name, email, phone, password };
        req.session.authType = "signup";


        console.log("OTP Sent:", otp);
        return res.render("user/verify-otp");
        
    } catch (error) {
        console.error("Signup error:", error);
        return res.redirect("/pageNotFound");
    }
};

// //  Verify OTP
const verifyotp = async (req, res) => {
    try {
        const { otp } = req.body;

        // Pick OTP page depending on flow
        const otpPage = req.session.authType === "forgot-password" 
            ? "user/forgot-otp" 
            : "user/verify-otp";

        if (!otp || !req.session.userOtp || !req.session.userData) {
            return res.render(otpPage, { message: "Session expired or missing OTP" });
        }

        if (otp === req.session.userOtp) {
            const { authType, userData } = req.session;

            if (authType === "signup") {
                const { name, email, phone, password } = userData;
          
                const passwordHash = await bcrypt.hash(password, 10);

                const saveUserData = new User({ name, email, phone, password: passwordHash });
                await saveUserData.save();

             
req.session.user = {
    _id: saveUserData._id.toString(),
    name: saveUserData.name,
    email: saveUserData.email,
};
                // clear session
                delete req.session.userOtp;
                delete req.session.userData;
                delete req.session.authType;

                return res.json({success:true,redirect:"/"});
            
        }
            else if (authType === "forgot-password") {
                req.session.isOtpVerified = true;
                return res.redirect("/reset-password");
            } 
            else {
                return res.render(otpPage, { message: "Invalid authentication type" });
            }
        } else {
            return res.render(otpPage, { message: "Invalid OTP." });
        }
    } catch (error) {
        console.error("OTP verification error:", error);
        return res.render("user/error", { message: "Internal server error." });
    }
};



// Resend OTP
const resendOtp = async (req, res) => {
    try {
      
        const { email } = req.session.userData;
        if (!email) {
            return res.json({ success: false, message: "Email not found in session" });
        }

        const otp = generateOtp();
        req.session.userOtp = otp;
// req.session.otpExpires = Date.now() + 1 * 60 * 1000
if (Date.now() > req.session.otpExpires) {
  return res.json({ success: false, message: "OTP expired. Please resend OTP." });
}


        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp);
            return res.json({ success: true, message: "OTP resent successfully" });
        } else {
            return res.json({ success: false, message: "Failed to resend OTP" });
        }
    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.json({ success: false, message: "Internal server error" });
    }
};

const loadOtpPage = (req, res) => {
  try {
    const email = req.session.userData?.email;
    if (!email) {
      return res.redirect("/signup");
    }
    res.render("user/verify-otp", { email, message: "" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Login
const loadLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            const success = req.session.success;
            const error = req.session.error;
            req.session.success = null;
            req.session.error = null;

            return res.render("user/login", { success, error });
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

//  Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ isAdmin: false, email });

        if (!findUser) {
        return res.json({success:false, message:"User not found"})
        }

        if (findUser.isBlocked) {
        return res.json({success:false,message:"User blocked by admin"})
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
             return res.json({ success: false, message: "Incorrect password" });
        }

        req.session.user = findUser._id;
        req.session.isAdmin=false;
   res.json({ success: true, message: "Login successful" });
      
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Login failed. Please try again." });
    }
};

//  Logout
const logout = async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.log("Session destruction error", err);
                return res.redirect("/pageNotFound");
            }
            return res.redirect("/login");
        });
    } catch (error) {
        console.log("Logout error:", error);
        res.redirect("/pageNotFound");
    }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Forgot Password
const loadForgotPassword = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("user/forgot-password");
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        console.error("Forgot password page error", error);
        res.redirect("/pageNotFound");
    }
};

//  Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email, isAdmin: false });

        if (!findUser) {
            return res.json({ success: false, message: "User not found" });
        }

        if (findUser.isBlocked) {
            return res.json({ success: false, message: "User is blocked by admin" });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.json({ success: false, message: "Failed to send OTP" });
        }

        req.session.userOtp = otp;
        req.session.userData = { email };
        req.session.authType = "forgot-password";

        console.log("Password reset OTP sent:", otp);
        return res.render("user/ForgotOtp");
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.json({ success: false, message: "Internal server error" });
    }
};





// Reset Password
const loadResetPassword = async (req, res) => {
    try {
        
        return res.render("user/newpassword"); 

    } catch (error) {
        console.error("Reset password page error:", error);
        res.redirect("/pageNotFound");
    }
};




const postResetPassword=async(req,res)=>{
    try {
        const{userId,password,confirmPassword}=req.body;
        if(!password||!confirmPassword){
             return res.json({success:false,message:"All field are required"})
    
        }
        if(password!==confirmPassword){
            return res.json({success:false,message:"password do not match"})
        }
        const passwordHash=await bcrypt.hash(password,10)
        await User.findByIdAndUpdate(password,{$set:{password:passwordHash}})
        return res.json({success:true,message:"password reset successfully"})
    } catch (error) {
        console.error(error)
        return res.json({success:false,message:"something went wrong"})
    }
}
// -------------------- Verify OTP --------------------

const verifyForgotOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (otp != req.session.userOtp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        req.session.isOtpVerified = true; // mark OTP verified
        return res.json({ success: true, redirect: "/reset-password" });
    } catch (error) {
        console.error("OTP verification error:", error);
        return res.json({ success: false, message: "Internal server error" });
    }
};



//  Reset Password
// --- Handle Reset Password ---
const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { email } = req.session.userData;


        if (!email) {
            return res.json({ success: false, message: "Session expired" });
        }

        if (password !== confirmPassword) {
            return res.json({ success: false, message: "Passwords do not match" });
        }

        const findUser = await User.findOne({ email, isAdmin: false });
        if (!findUser) {
            return res.json({ success: false, message: "User not found" });
        }

        findUser.password = await bcrypt.hash(password, 10);
        await findUser.save();
console.log("Password updated successfully for:", email);
console.log("Updated hashed password:", findUser.password);

        // Clear session
        delete req.session.userOtp;
        delete req.session.userData;
        delete req.session.authType;
        delete req.session.isOtpVerified;

        return res.json({ success: true, message: "Password reset successfully", redirect: "/login" });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.json({ success: false, message: "Internal server error" });
    }
};

//  Error
const loadErrorPage = (req, res) => {
    res.render("user/error");
};








module.exports = {
    loadHomepage,
    pageNotFound,
    loadShopping,
    loadSignup,
    signup,
    verifyotp,
    resendOtp,  
    loadLogin,
    login,
    logout,
    loadForgotPassword,
    forgotPassword,
    loadResetPassword,
    resetPassword,
    loadErrorPage,
    loadOtpPage,
    verifyForgotOtp ,
    postResetPassword

  
};