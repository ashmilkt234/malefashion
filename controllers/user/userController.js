// userController.js
const User = require("../../models/userSchema.js");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

//  Generate OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

//  Send OTP Email
async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
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
const loadHomepage = async (req, res) => {
    try {
        if (req.session.user) {
            const userData = await User.findById(req.session.user._id);
            if (!userData) {
                return res.render("user/error", { message: "User not found" });
            }
            return res.render("user/home", { user: userData });
        }
        return res.render("user/home");
    } catch (error) {
        console.log("Homepage load error:", error);
        return res.render("user/error", { message: "Server error" });
    }
};

//  Shopping
const loadShopping = async (req, res) => {
    try {
        return res.render("shop");
    } catch (error) {
        console.log("Shopping page error", error);
        res.status(500).send("Server Error");
    }
};

//  Signup
const loadSignup = async (req, res) => {
    try {
        return res.render("user/signup");
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

        req.session.userOtp = otp;
        req.session.userData = { name, email, phone, password };
        req.session.authType = "signup";

        console.log("OTP Sent:", otp);
        return res.render("user/verify-otp");
    } catch (error) {
        console.error("Signup error:", error);
        return res.redirect("/pageNotFound");
    }
};

//  Verify OTP
const verifyotp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp || !req.session.userOtp || !req.session.userData) {
            return res.json({ success: false, message: "Session expired or missing OTP" });
        }

        if (otp === req.session.userOtp) {
            const { authType, userData } = req.session;

            if (authType === "signup") {
                const { name, email, phone, password } = userData;
                const passwordHash = await bcrypt.hash(password, 10);

                const saveUserData = new User({
                    name,
                    email,
                    phone,
                    password: passwordHash
                });
                await saveUserData.save();

                req.session.user = saveUserData;
                delete req.session.userOtp;
                delete req.session.userData;
                delete req.session.authType;

                return res.json({ success: true, message: "OTP verified. Account created." });
            } else if (authType === "forgot-password") {
                return res.json({ success: true, message: "OTP verified. Proceed to reset password.", redirect: "/reset-password" });
            } else {
                return res.json({ success: false, message: "Invalid authentication type" });
            }
        } else {
            return res.json({ success: false, message: "Invalid OTP." });
        }
    } catch (error) {
        console.error("OTP verification error:", error);
        return res.json({ success: false, message: "Internal server error." });
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
req.session.otpExpires = Date.now() + 1 * 60 * 1000

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
function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()
}
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
            req.session.error = "User not found";
            return res.redirect("/login");
        }

        if (findUser.isBlocked) {
            req.session.error = "User is blocked by admin";
            return res.redirect("/login");
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            req.session.error = "Incorrect password";
            return res.redirect("/login");
        }

        req.session.user = findUser;
        req.session.success = "Logged in successfully!";
        return res.redirect("/");
    } catch (error) {
        console.error("Login error:", error);
        req.session.error = "Login failed. Please try again.";
        return res.redirect("/login");
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
        return res.render("user/verify-otp");
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.json({ success: false, message: "Internal server error" });
    }
};

// Reset Password
const loadResetPassword = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email || req.session.authType !== "forgot-password") {
            return res.redirect("/forgot-password");
        }
        return res.render("user/reset-password");
    } catch (error) {
        console.error("Reset password page error:", error);
        res.redirect("/pageNotFound");
    }
};

//  Reset Password
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

        delete req.session.userOtp;
        delete req.session.userData;
        delete req.session.authType;

        return res.json({ success: true, message: "Password reset successfully" });
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
  
};