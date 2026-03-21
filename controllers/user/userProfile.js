// Import models
const User = require("../../models/userSchema");
const Otp = require("../../models/otpSchema")
const sendVerificationEmail=require("../../utils/sendVerificationEmail")
const generateOtp=require("../../utils/generateOtp")

const bcrypt = require("bcrypt");
const Address = require("../../models/addressSchema");
const { render } = require("ejs");
const { transformAuthInfo } = require("passport");
const fs=require("fs")
const path=require("path")
// ================= User Profile =================
const getUserProfile = async (req, res) => {
  try {

    if (!req.session.user) {
      return res.redirect("/login");
    }
console.log(req.session.user)
    // Get user details
    const user = await User.findById(req.session.user).lean();
    const successMsg = req.query.success === "email_updated" 
      ? "Email updated successfully!" 
      : null
    console.log("session user",req.session.user)

    // If user not found
    if (!user) {
      return res.status(404).json({
        success: false, 
        message: "User not found"
      });
    }

    // Render user profile page
    return res.render("user/userprofile", { user:req.user,messages: req.flash(),user});
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
    let userId=req.session.user
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


//updateprofile

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!req.session.user) return res.redirect("/login");

    await User.findByIdAndUpdate(
      req.session.user,
      { name, phone },
      { new: true }
    );

    res.redirect("/profile");
  } catch (error) {
    console.log("Update profile error:", error);
    res.status(500).send("Error updating profile");
  }  
}


//changeEmail
const postEmailChange = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/login");

    const { email } = req.body;
    if (!email) {
      return res.render("user/changeEmail", {
        message: "Email is required",
        type: "error"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.session.user.toString()) {
      return res.render("user/changeEmail", {
        message: "This email is already in use by another account",
        type: "error"
      });
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.render("user/changeEmail", {
        message: "Failed to send OTP. Please try again.",
        type: "error"
      });
    }


    req.session.newEmail = email;
    req.session.emailOtp = otp.toString();           
    req.session.otpExpiry = Date.now() + 5 * 60 * 1000;

    return res.render("user/verify-email-otp", {
      message: `OTP sent to ${email}`,
      type: "success"
    });

  } catch (error) {
    console.error("postEmailChange error:", error);
    return res.redirect("/pageNotFound");
  }
};



   




//verifyotp
const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.session.user) {
      return res.status(400).json({
        success: false,
        message: "Please log in again."
      });
    }

  
    const isEmailFlow    = req.session.newEmail    && req.session.emailOtp;
    const isUsernameFlow = req.session.newUsername && req.session.usernameOtp;

    if (!isEmailFlow && !isUsernameFlow) {
      return res.status(400).json({
        success: false,
        message: "Session expired. Please start again."  
      });
    }

 
    if (isEmailFlow) {
      if (!otp || otp.trim() !== req.session.emailOtp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. Please try again."
        });
      }
      if (Date.now() > req.session.otpExpiry) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please resend."
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.session.user,
        { email: req.session.newEmail },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please log in again."
        });
      }

      delete req.session.newEmail;
      delete req.session.emailOtp;
      delete req.session.otpExpiry;

      return res.status(200).json({
        success: true,
        message: "Email updated successfully!",
        redirectTo: "/profile"
      });
    }

    // ────────────────────────────
    // USERNAME FLOW
    // ────────────────────────────
    if (isUsernameFlow) {
      if (!otp || otp.trim() !== req.session.usernameOtp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. Please try again."
        });
      }
      if (Date.now() > req.session.usernameOtpExpiry) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please resend."
        });
      }

      const existing = await User.findOne({ username: req.session.newUsername });
      if (existing && existing._id.toString() !== req.session.user.toString()) {
        return res.status(400).json({
          success: false,
          message: "Username was taken. Please choose another."
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.session.user,
        { name: req.session.newUsername },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please log in again."
        });
      }

      delete req.session.newUsername;
      delete req.session.usernameOtp;
      delete req.session.usernameOtpExpiry;

      return res.status(200).json({
        success: true,
        message: "Name updated successfully!",
        redirectTo: "/profile"
      });
    }

  } catch (error) {
    console.error("verifyEmailOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again."
    });
  }
};
//editprofile
const loadEditProfile=async(req,res)=>{
  try {
    if(!req.session.user){
      return res.redirect("/login")
    }
    const user=await User.findById(req.session.user).lean()
    console.log("user",user)
    if(!user){
      return res.redirect("/login")
    }
  res.render("user/editProfile",{user})
  } catch (error) {
    console.log("Edit profile error:", error);
    res.redirect("/pageNotFound");
  }

}


//changeemailchange
const getEmailChange=async(req,res)=>{
try {
  if(!req.session.user)return res.redirect("/login")
    res.render("user/changeEmail",{message:null,type:null})
} catch (error) {
  res.redirect("/pageNotFound");
}
}



///updateemail
// const updateEmail=async(req,res)=>{
//   try {
//       if (!req.session.user) {
//       return res.redirect("/login");

//     }
//      const { otp } = req.body;
//      if (!req.session.emailOtp || Date.now() > req.session.otpExpiry) {
//       return res.render("user/verify-email-otp", {
//         message: "OTP expired",
//         type: "error"
//       });
//     }
//      if (otp !== req.session.emailOtp) {
//       return res.render("user/verify-email-otp", {
//         message: "Invalid OTP",
//         type: "error"
//       });
//     }
//     await User.findByIdAndUpdate(req.session.user, {
//       email: req.session.newEmail
//     });

//    delete req.session.emailOtp;
//     delete req.session.newEmail;
//     delete req.session.otpExpiry;
//     res.render("user/newEmail", {
//       message: "Email updated successfully ",
//       type: "success"
//     });
//   } catch (error) {
//         res.redirect("/pageNotFound");
//   }





//resend otp

const resendEmailOtp = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(400).json({
        success: false,
        message: "Please log in again."
      });
    }

    const otp = generateOtp();

    if (req.session.newEmail) {
      await sendVerificationEmail(req.session.newEmail, otp);
      req.session.emailOtp = String(otp);
      req.session.otpExpiry = Date.now() + 5 * 60 * 1000;
      return res.json({ success: true, message: "OTP resent to your email." });
    }


    if (req.session.newUsername) {
      const user = await User.findById(req.session.user).select("email");
      if (!user?.email) {
        return res.status(400).json({ success: false, message: "No email found." });
      }
      await sendVerificationEmail(user.email, otp);
      req.session.usernameOtp = String(otp);
      req.session.usernameOtpExpiry = Date.now() + 5 * 60 * 1000;
      return res.json({ success: true, message: "OTP resent to your email." });
    }

    return res.status(400).json({
      success: false,
      message: "Session expired. Please start again."
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP."
    });
  }
};

const postChangeUsername = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login")
    }
    const{username}=req.body
    if(!username){
      return res.render("user/changeUsername",{message: "Username is required",
        type: "error"})
    }
    if(username.length<3||username.length>20){
  return res.render("user/changeUsername", {
        message: "Username must be 3–20 characters long",
        type: "error"
  })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.render("user/changeUsername", {
        message: "Username can only contain letters, numbers, and underscore",
        type: "error"
      });
    }
const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== req.session.user.toString()) {
      return res.render("user/changeUsername", {
        message: "This username is already taken",
        type: "error"
      });
    }
    const otp = generateOtp();
    const user = await User.findById(req.session.user).select('email');
 if(!user?.email){
  return res.render("user/changeUsername",{message:"No email found. Please update your email first.",
        type: "error"})
 }
const emailSend=await sendVerificationEmail(user.email,otp)
if(!emailSend){
  return res.render("user/changeUsername",{message:"Failed to send OTP.Try again later.",
        type: "error"})
}
req.session.newUsername = username
req.session.usernameOtp = otp.toString()
req.session.usernameOtpExpiry = Date.now() + 5 * 60 * 1000

return res.render("user/verify-email-otp", { 
      message: `OTP sent to your email (${user.email})`,
      type: "success"
    });
    } catch (error) {
    console.error("Change username error:", error);
    return res.redirect("/pageNotFound");
  }
};

const verifyUsernameOtp = async (req, res) => {
  try {
    if (!req.session.user || !req.session.newUsername || !req.session.usernameOtp) {
      return res.status(400).json({
        success: false,
        message: "Session expired. Please start again."
      });
    }
    const{otp}=req.body
    if(!otp||otp.trim()!==req.session.usernameOtp){
      return res.status(400).json({success:false, message:"Invalid otp please try again"})
    }
    if(Date.now()>req.session.usernameOtpExpiry){
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      })
    }
    const existing = await User.findOne({ username: req.session.newUsername });
    if (existing && existing._id.toString() !== req.session.user.toString()) {
      return res.status(400).json({
        success: false,
        message: "Username was taken in the meantime."
      })
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user,
      { username: req.session.newUsername },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      })
    }
    delete req.session.newUsername
     delete req.session.usernameOtp
      delete req.session.usernameOtpExpiry
      return res.status(200).json({
      success: true,
      message: "Username updated successfully!",
      redirectTo: "/profile"
    })
    } catch (error) {
    console.error("Verify username OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

const resendUsernameOtp = async (req, res) => {
  try {
    if (!req.session.user || !req.session.newUsername) {
      return res.status(400).json({
        success: false,
        message: "Session expired."
      })
    }
    const user=await User.findById(req.session.user).select("email")
    if (!user?.email) {
      return res.status(400).json({ success: false, message: "No email found" });
    }
    const otp = generateOtp()
const sent = await sendVerificationEmail(user.email, otp)
if (!sent) {
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
    req.session.usernameOtp = otp.toString();
    req.session.usernameOtpExpiry = Date.now() + 5 * 60 * 1000
     return res.json({success:true,message:"New OTP sent to your email"})
     } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
const getChangeUsername = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    const user=await User.findById(req.session.user).select('username email')
    if(!user){
      return res.redirect("/profile?error=user_not_found")

    }
    res.render("user/changeUsername",{
      user,message:null,type:null,title:"Change Username"
    })
    }

    catch(error){
      console.error("chage eroor",error)
        }
  }





const uploadProfilePicture = async(req,res)=>{
 try {
console.log(req.file)
    const userId = req.session.user
console.log("userid",userId)
    if(!req.file){
        return res.redirect("/userProfile")
    }

    await User.findByIdAndUpdate(userId,{
        profilePicture:req.file.filename
    })

    res.redirect("/userProfile")

 } catch (error) {

    console.log("Profile upload error:",error)
    res.redirect("/userProfile")

 }
}
const removeProfilePhoto = async (req, res) => {
  try {
  const userId =  req.session.user


    const user = await User.findById(userId);
  if (!user) {
      return res.redirect('/login'); 
    }
    // Delete file from uploads folder
    if (user.profilePicture) {
      const filePath = path.join(__dirname, '../uploads/profile/', user.profilePicture);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); //
      }
    }

    // Remove from database
    await User.findByIdAndUpdate(userId, { profilePicture: null });

    req.flash('success', 'Profile photo removed successfully');
    res.redirect('/userProfile');

  } catch (error) {
    console.log('Remove photo error:', error);
    req.flash('error', 'Failed to remove photo');
    res.redirect('/userProfile');
  }
};




      module.exports = {
  getUserProfile,
  getchangepassword,
  postchangepassword,
  updateProfile,
postEmailChange,
  verifyEmailOtp,
  loadEditProfile,
  getEmailChange,
  uploadProfilePicture,
  // updateEmail,
  resendEmailOtp,
  postChangeUsername,
  verifyUsernameOtp,
   resendUsernameOtp,
   getChangeUsername,
     removeProfilePhoto 

};
