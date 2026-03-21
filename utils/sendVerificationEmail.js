const nodemailer = require("nodemailer");

const sendVerificationEmail = async (email, otp) => {
  try {
    console.log("Sending OTP:", otp, "to", email);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: process.env.EMAIL_PORT || 587,
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
      html: `<b>Your OTP: ${otp}</b>`,
    });

    console.log("Email accepted:", info.accepted);

    return info.accepted && info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = sendVerificationEmail;
