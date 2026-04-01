const otpModel = require("../models/user/otpModel");
const crypto = require("crypto");
const sendOtpEmail = require("../utils/emails/otpEmail");
const UserModel = require("../models/user/userModel");

const sendOtpController = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("email coming",req.body);

     if (!email) {
     return res.status(400).json({ message: "Email is required" });
     }
    const user = await UserModel.findOne({ email });

    const otp = crypto.randomInt(100000, 999999).toString();

    await otpModel.create({ email, otp });
    try{

      console.log("email",email);
      console.log("otp",otp);
      console.log("firstName",user.firstName);
      console.log("lastName",user.lastName);
   const res= await sendOtpEmail({
     email,
      otp,
     firstName: user.firstName || "precious",
     lastName: user.lastName || "user",
     });
    }
    
    catch(e){
      console.log(e);
      res.status(500).json({ message: "Failed to send OTP",error:e.message });
    }

    res.status(200).json({ message: "OTP sent successfully", }); // ⚠️ remove `otp` in prod
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpRecord = await otpModel.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Optional: remove used OTP
    await otpModel.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

module.exports = {
  sendOtpController,
  verifyOtpController,
};
