// userController.js
const User = require("../../models/userSchema.js");
const Category=require('../../models/categorySchema')
const Product=require("../../models/productSchema")
const Otp = require("../../models/otpSchema");
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




// //  Verify OTP
const verifyotp = async (req, res) => {
  try {
    const { otp } = req.body;
    const { email } = req.session.userData;

    const otpRecord = await Otp.findOne({ email, purpose: "signup" });

    if (!otpRecord) {
      return res.render("user/verify-otp", { message: "OTP expired" });
    }

    if (Date.now() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.render("user/verify-otp", { message: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      return res.render("user/verify-otp", { message: "Invalid OTP" });
    }

    // OTP SUCCESS
    await Otp.deleteOne({ _id: otpRecord._id });

    const { name, phone, password } = req.session.userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword
    });

    await user.save();

    req.session.user = user._id;
    req.session.userData = null;
    req.session.authType = null;

    return res.json({ success: true, redirect: "/" });

  } catch (error) {
    console.error(error);
    return res.render("user/error", { message: "Server error" });
  }
};





// Resend OTP
const resendOtp = async (req, res) => {
  const email = req.session.userData?.email;
  const purpose = req.session.authType;

  if (!email || !purpose) {
    return res.json({ success: false, message: "Session expired" });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await Otp.deleteMany({ email, purpose });

  await Otp.create({
    email,
    otp: hashedOtp,
    purpose,
    expiresAt: Date.now() + 60 * 1000
  });

  await sendVerificationEmail(email, otp);

  return res.json({ success: true, message: "OTP resent successfully" });
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

//404
const pageNotFound = async (req, res) => {
    try {
        res.render("user/page_404");
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

// Homepage
// controller
const loadHomepage = async (req, res) => {
  try {

    const categories = await Category.find({ isListed: true ,isDeleted:false}).lean();


    const productData = await Product.find({
      isBlocked: false,
      isDeleted:{$ne:true},
      category: { $in: categories.map(c => c._id) },
      quantity: { $gt: 0 },
    })
      .sort({ createdAt: -1 })  
      .limit(5)
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


    const { category, sort, page = 1, minPrice, maxPrice, search } = req.query;

    const limit = 8;
    const skip = (page - 1) * limit;

    // Fetch ONLY listed categories
    const categories = await Category.find({ isListed: true,isDeleted:false }).lean();
    const categoryIds = categories.map(c => c._id.toString());

    let filter = {
      isBlocked: false,
 isDeleted:{$ne:true},
      quantity: { $gt: 0 },
      category: { $in: categoryIds } 
    };

     const totalProducts = await Product.countDocuments({isDeleted: { $ne: true },
  quantity: { $gt: 0 },
  category: { $in: categoryIds }})

    //  Search
    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    //  Price filter
    if (minPrice || maxPrice) {
      filter.salesPrice = {};
      if (minPrice) filter.salesPrice.$gte = Number(minPrice);
      if (maxPrice) filter.salesPrice.$lte = Number(maxPrice);
    }

    // Category validation
    if (category) {
      if (!categoryIds.includes(category)) {
        return res.redirect("/shop"); // blocked category
      }
      filter.category = category;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "lowtohigh") sortOption = { salesPrice: 1 };
    if (sort === "hightolow") sortOption = { salesPrice: -1 };

    // Count
   ;

    // Fetch products
    const products = await Product.find(filter)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // Render
    res.render("user/shop", {
      user: req.session.user || null,
      products,
      categories,
      selectedCategory: category || null,
      sort: sort || "",
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      search: search || "",
      title: "Shop - Men's Fashion",
      breadcrumb: [
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        category
          ? { name: categories.find(c => c._id.toString() === category)?.name, url: "#" }
          : null
      ].filter(Boolean)
    });

  } catch (error) {
    console.error("Shopping page error:", error);
    res.status(500).render("user/shop", {
      user: req.session.user || null,
      products: [],
      categories: [],
      title: "Shop - Men's Fashion",
      error: "Unable to load products at this time."
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

  if (password !== confirmPassword) {
    return res.render("user/signup", { message: "Passwords do not match" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render("user/signup", { message: "Email already exists" });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // delete old OTPs
  await Otp.deleteMany({ email, purpose: "signup" });

  await Otp.create({
    email,
    otp: hashedOtp,
    purpose: "signup",
    expiresAt: Date.now() + 60 * 1000
  });

  await sendVerificationEmail(email, otp);

  req.session.userData = { name, email, phone, password };
  req.session.authType = "signup";

  return res.render("user/verify-otp");
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
  const { email } = req.body;

  const user = await User.findOne({ email, isAdmin: false });
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await Otp.deleteMany({ email, purpose: "forgot-password" });

  await Otp.create({
    email,
    otp: hashedOtp,
    purpose: "forgot-password",
    expiresAt: Date.now() + 60 * 1000
  });

  await sendVerificationEmail(email, otp);

  req.session.userData = { email };
  req.session.authType = "forgot-password";

  return res.render("user/ForgotOtp");
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
     await User.findOneAndUpdate(
  { email: req.session.userData.email },
  { password: passwordHash }
)
        return res.json({success:true,message:"password reset successfully"})
    } catch (error) {
        console.error(error)
        return res.json({success:false,message:"something went wrong"})
    }
}
// -------------------- Verify OTP --------------------

const verifyForgotOtp = async (req, res) => {
  const { otp } = req.body;
  const { email } = req.session.userData;

  const otpRecord = await Otp.findOne({ email, purpose: "forgot-password" });

  if (!otpRecord) {
    return res.json({ success: false, message: "OTP expired" });
  }

  if (Date.now() > otpRecord.expiresAt) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return res.json({ success: false, message: "OTP expired" });
  }

  const valid = await bcrypt.compare(otp, otpRecord.otp);
  if (!valid) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  await Otp.deleteOne({ _id: otpRecord._id });

  req.session.isOtpVerified = true;
  return res.json({ success: true, redirect: "/reset-password" });
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