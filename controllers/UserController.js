// New (CommonJS)
const axios = require("axios");

const OpenAccountMail = require("../emails/OpenAccountMail.js");
// import OpenAccountMail from "../emails/OpenAccountMail.js";
// import { metaApi } from "../utils/apiClients.js";
const metaApi = require("../utils/apiClients.js");

const useragent = require("useragent");
const request = require("request");
const UserModel = require("../models/user/userModel.js");
const UserLogModel = require("../models/user/UserLogModel.js");   
const SessionModel = require("../models/user/SessionModel.js");
const { validateAndSanitizeImage } = require("../utils/validateImage");

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const geoip = require("geoip-lite");
const transporter = require("../config/user/emailTransportal.js");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const adminUserModel = require("../models/admin/adminUserModel.js");
const CustomMailModel=require("../models/MailReference/MailTransportation.js");
const { copyClient } = require("../services/metaClient.js");

// const sessionId = crypto.randomBytes(16).toString("hex");
// console.log("sessionId", sessionId);

dotenv.config();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/kyc";
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(), 
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

const uploadFields = upload.fields([
  { name: "frontSideOfDocument", maxCount: 1 },
  { name: "backSideOfDocument", maxCount: 1 },
  { name: "selfieWithDocument", maxCount: 1 },
]);
// signup ---------------------

const registerUserController = async (req, res) => {
  const Body = req.body;
  const { id } = req.params;

  console.log("id->>>>>>>>", id);

  try {
    const referralByUser = id
      ? await UserModel.findOne({ referralAccount: id })
      : null; // find user by referral id

    console.log("referralByUser->>>>>>>>", referralByUser);

    const emailExists = await UserModel.findOne({ email: Body.email });
    if (emailExists) {
      return res
        .status(400)
        .json({ msg: "Email already exists", status: false });
    }
    // Hash the password
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(Body.password, saltRounds);

    // const token = crypto.randomBytes(32).toString("hex");
    // const tokenExpiry=new Date(Date.now()+60*60*1000);
    const user = await UserModel.create({
      firstName: Body.firstName,
      lastName: Body.lastName,
      email: Body.email,
      phone: Body.phone,
      country: Body.country,
      state: Body.state,
      city: Body.city,
      zipCode: Body.zipCode,
      address: Body.address,
      password: hashedPassword,
      Actualpassword: Body.password,
      referralFromUserId: referralByUser?._id,
      referralFromId: id || null,
      // token:token,
      // tokenExpiry:tokenExpiry,
    });

    req.body.userId = user._id;

await sendVerificationLinkController(req,res);


    // if (user) {
    //   res.status(201).json({
    //     msg: "User created successfully",
    //     user: user,
    //     status: true,
    //   });
    // } else {
    //   return res
    //     .status(400)
    //     .json({ msg: "Something went wrong", status: false });
    // }
  } catch (error) {
    console.error("Error in registerUser:", error.message);
    return res
      .status(500)
      .json({ msg: "Internal Server Error", status: false });
  }
};

// login--------------------------
const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  console.log("email ", email);

  try {
    // Find the user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password1", status: false, user });
    }
    // Verify the password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000;
      }

      await user.save();

      return res.status(401).json({
        message: "Invalid email or password",
        status: false,
      });
    }

    // Reset attempts if correct
    user.loginAttempts = 0;
    user.lockUntil = null;

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email not verified",
      });
    }


   let sessionId;
let sessionExists = true;
let attempts = 0;

while (sessionExists && attempts < 5) {
  sessionId = crypto.randomBytes(16).toString("hex");

  const found = await SessionModel.findOne({ sessionId });

  if (!found) {
    sessionExists = false; // unique mil gaya
  }

  attempts++;




    const accessToken = jwt.sign(
      {
        userId: user._id,    //req.userId.
        role: "users",
        sessionId: sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "16m" },
    );


    const refreshToken = jwt.sign(
      {
        userId: user._id,
        role: "users",
        sessionId,
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "1hr" },
    );

    user.refreshToken = refreshToken;
    await user.save();


    const data = await SessionModel.create({
      userId: user._id,
      sessionId: sessionId,
      role: "users",

      expiresAt: new Date(Date.now() +  60 * 60 * 1000), //1 hr ///refresh token expiry time
    });


    // 🍪 Secure cookies
    res.cookie("userat", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15* 60 * 1000, //15min
    });

    res.cookie("userrt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, //1hr
    });

    // jwt.verify(token, process.env.JWT_SECRET);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password2",
        status: false,
        isPasswordMatch,
        password,
        pss: user.password,
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.json({ message: "Email not verified3", status: false });
    }

    // Parse the user agent string
    const userAgentString = req.headers["user-agent"];
    const agent = useragent.parse(userAgentString);

    // Determine browser
    let browser;
    if (userAgentString.includes("Edg/")) {
      browser = "Microsoft Edge";
    } else if (userAgentString.includes("Chrome/")) {
      browser = "Google Chrome";
    } else if (userAgentString.includes("Firefox/")) {
      browser = "Mozilla Firefox";
    } else if (
      userAgentString.includes("Safari/") &&
      !userAgentString.includes("Chrome/")
    ) {
      browser = "Apple Safari";
    } else {
      browser = agent.toAgent(); // Fallback to useragent parsing
    }

    // Determine OS
    const os = agent.os.family;

    // 🔐 Secure cookie

    // Fetch user's public IP
const ip = await new Promise((resolve, reject) => {
  request.get("http://api.ipify.org?format=json", (err, response, body) => {
    if (err) {
      return reject(err);
    }

    try {   
      const parsed = JSON.parse(body);
      resolve(parsed.ip);
    } catch (parseError) {
      console.error("Invalid JSON from ipify:", body);
      resolve("Unknown"); // fallback instead of crashing
    }
  });
});

    // Get geolocation based on IP
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : "Unknown";  

    // Store the user's log
    const newUserLog = await UserLogModel.create({
      userId: user._id,
      browser,
      os,
      country,
      ip,
    });

    // 🔐 Secure cookie

    res.json({
      msg: "User logged in successfully",
      user: user,
      status: true,
      newUserLog: newUserLog,
      role: user.role,
    });
  }













 } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error",error:error.message });
  }
};

// update Password--------------------------

const updatePasswordController = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // Find the user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Verify the current password
    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect", status: false });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.json({
      msg: "Password updated successfully",
      status: true,
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      message: "Server error",
      status: false,
    });
  }
};

// send reset link -----------------

const sendForgotPasswordController = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Store the token and expiry in the database
    user.resetPasswordToken = resetToken;
    console.log("resetPassword",resetToken);
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send the reset link via email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const customContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Password Reset - ${
        process.env.WEBSITE_NAME || "Forex Funding"
      }</title>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: #fff;
          padding: 5px;
        }
        .header {
          background: #19422df2;
          color: #fff;
          padding: 20px 15px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          letter-spacing: 1px;
        }
        .content {
          padding: 15px 20px;
        }
        .cta-button {
          display: inline-block;
          padding: 12px 24px;
          background: #2d6a4f;
          color: #fff !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 15px 0;
        }
        .footer {
          background: #19422df2;
          color: #fff;
          text-align: center;
          padding: 5px 10px;
          font-size: 12px;
          border-radius: 0 0 10px 10px;
        }
        .footer-info {
          margin-top: 6px;
        }
        .footer-info a {
          color: #B6D0E2;
          text-decoration: none;
        }
        .risk-warning {
          color: #C70039;
          font-size: 12px;
          padding: 10px 0 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${`${user.firstName} ${user.lastName}`},</p>
          <p>We received a request to reset your account password. Click the button below to proceed:</p>
          <a href="${resetLink}" class="cta-button">Reset Password</a>
          <p><strong>Note:</strong> This link is valid for <strong>1 hour</strong>. If you didn’t request this, you can safely ignore this email.</p>
          <p>Thank you for choosing ${process.env.WEBSITE_NAME || ""}.</p>
          <p>Best regards,<br/>The ${process.env.WEBSITE_NAME || ""} Team</p>
          <hr />
          <div class="risk-warning">
            <strong>Risk Warning:</strong> Trading CFDs involves significant risk and may result in losses exceeding your deposit. Please trade responsibly.
            <br/><br/>
            Our services are not available to U.S. residents or in jurisdictions where prohibited by law.
          </div>
        </div>
        <div class="footer">
         <div class="footer-info">
  <p>${process.env.EMAIL_ADDRESS || ""}</p>
    <p>Website: <a href="https://${process.env.EMAIL_WEBSITE || ""}"> ${
      process.env.EMAIL_WEBSITE
    } </a> | E-mail: <a href="mailto:${process.env.EMAIL_EMAIL || ""}">${
      process.env.EMAIL_EMAIL
    }</a></p>
    <p>&copy; 2025 ${process.env.WEBSITE_NAME || ""}. All Rights Reserved</p>
  </div>
        </div>
      </div>
    </body>
    </html>`;

    console.log(user.email);
    console.log(process.env.WEBSITE_NAME);
    console.log(process.env.NODEMAILER_SENDER_EMAIL);
    console.log(customContent);
    console.log();

    const mailOptions = {
      to: user.email,
      from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
      subject: "Password Reset Request",
      html: customContent,
    };

    const response=await transporter.sendMail(mailOptions);
    if(!response){
      return res.status(500).json({message:"Server Error"})
    }

    const customModel=await CustomMailModel.create({
      emailId:user.email,
      subject:"Password Reset Request",
    })
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalMailCountToday = await CustomMailModel.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });


    res.json({ message: "Password reset link sent to your email." ,customModel,totalMailCountToday});
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Server error",error:error.message });
  }
};
// verify and reset password ------------------

const resetPasswordController = async (req, res) => {
  const { token } = req.params;
  const { newPassword} = req.body;
  try {
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // // Save the new password and clear the reset token and expiry
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    // res.json({ message: "Password has been changed successfully." });

    try {
      const customContent = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Password Changed - ${
          process.env.WEBSITE_NAME || "Forex Funding"
        }</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            padding: 5px;
          }
          .header {
            background-color: #19422df2;
            color: #ffffff;
            padding: 20px 15px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            letter-spacing: 1px;
          }
          .content {
            padding: 15px 20px;
          }
          .login-details {
            background-color: #f8f8f8;
            border-left: 4px solid #2d6a4f;
            padding: 15px;
            margin: 20px 0;
          }
          .login-details p {
            margin: 5px 0;
          }
          .highlight {
            font-weight: bold;
            color: #0a2342;
          }
          .footer {
            background-color: #19422df2;
            color: #ffffff;
            text-align: center;
            padding: 5px 10px;
            font-size: 12px;
            border-radius: 0 0 10px 10px;
          }
          .footer-info {
            margin-top: 6px;
          }
          .footer-info a {
            color: #B6D0E2;
            text-decoration: none;
          }
          .risk-warning {
            color: #C70039;
            font-size: 12px;
            padding: 10px 0 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <p>Dear Trader,</p>
            <p>Your password has been successfully updated. You can now log in using the credentials below:</p>
      
            <div class="login-details">  
              <p><span class="highlight">Username / Email:</span> ${
                user.email
              }</p>
              <p><span class="highlight">New Password:</span> ${newPassword}</p>
              <p><a href="https://${
                process.env.FRONTEND_URL
              }/login" style="color:#2d6a4f; font-weight:bold;">Go to Login Page</a></p>
            </div>
      
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>Thank you for choosing ${process.env.WEBSITE_NAME || ""}.</p>
            <p>Best regards,<br/>The ${process.env.WEBSITE_NAME || ""} Team</p>
            <hr />
            <div class="risk-warning">
              <strong>Risk Warning:</strong> Trading CFDs involves high risk and can result in losses beyond your initial investment. Please trade responsibly.
              <br/><br/>
              Our services are not available to U.S. residents or where prohibited by law.
            </div>
          </div>
          <div class="footer">
            <div class="footer-info">
  <p>${process.env.EMAIL_ADDRESS || ""}</p>
    <p>Website: <a href="https://${process.env.EMAIL_WEBSITE || ""}"> ${
      process.env.EMAIL_WEBSITE
    } </a> | E-mail: <a href="mailto:${process.env.EMAIL_EMAIL || ""}">${
      process.env.EMAIL_EMAIL
    }</a></p>
    <p>&copy; 2025 ${process.env.WEBSITE_NAME || ""}. All Rights Reserved</p>
  </div>
          </div>
        </div>
      </body>
      </html>`;

      const mailOptions = {
        to: user.email,
        from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
        subject: "Password Changed",
        html: customContent,
      };

      const response=await transporter.sendMail(mailOptions);
      if(!response){
        return res.status(500).json({message:"Server Error"});
      }
      const CustomModel=await CustomMailModel.create({
        email:user.email,
        subject:"Password Changed",

      })
      const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalMailCountToday = await CustomMailModel.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return res.status(200).json({message:"CustomMail for reset password sent successfully",CustomModel,totalMailCountToday});
    } catch (error) {
      console.log("error sending mail", error);
        return res.status(500).json({
    message: "Error sending mail",
    error: error.message,
  });

    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// get all Users --------------

const getUsersController = async (req, res) => {
  try {
    const { page, limit, search, emailVerified, kycVerified, referralUsers } =
      req.query;

    // Define the query object
    let query = {};

    // Boolean filters
    if (emailVerified !== undefined) {
      query.emailVerified = emailVerified === "true";
    }
    if (kycVerified !== undefined) {
      query.kycVerified = kycVerified === "true";
    }

    // Referral user filter (if referralUsers flag is true, find users who were referred)
    if (referralUsers === "true") {
      query.referralAccount = { $ne: null }; // Users with referralAccount not null
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mt5Account: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination setup
    if (page && limit) {
      const pageNumber = parseInt(page) || 1;
      const limitNumber = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const data = await UserModel.find(query)
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 });
      const total = await UserModel.countDocuments(query);

      return res.json({
        msg: "Users retrieved successfully with applied filters",
        data,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalUsers: total,
        },
      });
    }

    // If no pagination, return all filtered users
    const data = await UserModel.find(query);
    return res.json({ msg: "Filtered users retrieved", data });
  } catch (error) {
    console.error("Error in retrieving users:", error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
};

// get all Users List --------------

const getUsersListController = async (req, res) => {
  try {
    const data = await UserModel.find();

    return res.json({
      msg: "Users retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error in retrieving users:", error);
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
};

// kyc submitted users

const getKycUsersController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Default page 1, limit 10
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Search filter
    const searchQuery = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const filterQuery = {
      // "kycDetails.status": "submitted",
      ...searchQuery,
    };

    const data = await UserModel.find(filterQuery)
      .sort({ "kycDetails.updatedAt": -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    console.log("data", data);

    const totalUsers = await UserModel.countDocuments(filterQuery);

    res.json({
      msg: "KYC submitted users retrieved",
      pagination: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limitNumber),
        currentPage: pageNumber,
      },
      data,
    });
  } catch (error) {
    console.error("Error retrieving KYC submitted users:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
// get User by id--------------

const getUserByIdController = async (req, res) => {
  //   const { id } = req.body;
  const { id } = req.user.id;

  try {
    const data = await UserModel.findById(req.user.id);
    if (data) {
      return res.json({ msg: "user retrieved", data, status: true });
    }
    return res.json({ msg: "user not found !!", status: false });
  } catch (error) {
    console.log("error in retrieved user--", error);
  }
};



const getAdminUserByIdController = async (req, res) => {
  //   const { id } = req.body;
  const { id } = req.query;

  try {
    const data = await UserModel.findById(id);
    if (data) {
      return res.json({ msg: "user retrieved", data, status: true });
    }
    return res.json({ msg: "user not found !!", status: false });
  } catch (error) {
    console.log("error in retrieved user--", error);
  }
};


const getUserByEmailController = async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ msg: "Email is required", status: false });
    }
    const data = await UserModel.findOne({ email });
    if (data) {
      return res
        .status(200)
        .json({ msg: "User retrieved successfully", data, status: true });
    }
    return res.status(404).json({ msg: "User not found", status: false });
  } catch (error) {
    console.error("Error retrieving user:", error);
    return res.status(500).json({ msg: "Server error", status: false });
  }
};

//   update user ---------------

const updateUserController = async (req, res) => {
  const { id, referralAccount, ...updateFields } = req.body;

  try {
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      return res
        .status(400)
        .json({ msg: "User not found", status: false, code: 103 });
    }

    if (referralAccount) {
      // 1. Check if referralAccount is being updated and is already in use
      const referralExists = await UserModel.findOne({
        _id: { $ne: id },
        referralAccount: referralAccount,
      });
      if (referralExists) {
        return res.status(400).json({
          msg: `Referral account '${referralAccount}' is already in use.`,
          status: false,
          code: 101,
        });
      }
      // 2. Check if referralAccount matches any user's accountNumber
      const referralAsAccount = await UserModel.findOne({
        "accounts.accountNumber": referralAccount,
      });

      if (referralAsAccount) {
        return res.status(400).json({
          msg: `Referral account '${referralAccount}' is already in use as an account number.`,
          status: false,
          code: 102,
        });
      }
    }

    // Combine updates
    const updateData = {
      ...updateFields,
    };
    if (referralAccount) updateData.referralAccount = referralAccount;

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.json({
      msg: "User updated successfully",
      status: true,  
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in update user:", error);
    return res
      .status(500)
      .json({ msg: "Server error", status: false, code: 104 });
  }
};

// send the verification link -------------------
let userStoreLink = {};

// const sendVerificationLinkController = async (req, res) => {
// const { email, userId, password } = req.body;

//   //  Generate a token
//   const verificationToken = crypto.randomBytes(32).toString("hex");

// // //   // Store the token with an expiration time (e.g., 1 hour)
//   userStoreLink[userId] = {
//     verificationToken,
//     expiresAt: Date.now() + 60 * 60 * 1000,
//  };

//   const verificationLink = `${process.env.FRONTEND_URL}/user/verify/${userId}/${verificationToken}`;

//    const credentialsBox = password
//  ? `
//   <div class="credentials-box">
//     <p class="highlight"><strong>🔐 Your Login Credentials</strong></p>
//        <p><strong>Email:</strong> ${email}</p>
//     <p><strong>Password:</strong> ${password}</p>
//       <p style="color: #C70039;"><em>Please store these details securely. Do not share with anyone.</em></p>
//    </div>
//   `
//    : "";

//   const customContent = `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//   <title>Withdrawal Request Confirmation - Arena Trade</title>
//   <style>
//     body, html {
//       margin: 0;
//       padding: 0;
//       font-family: 'Arial', sans-serif;
//       line-height: 1.6;
//       color: #333;
//       background-color: #f4f4f4;
//     }
//     .container {
//       max-width: 600px;
//       margin: 0 auto;
//       padding: 5px;
//       background-color: #ffffff;
//     }
//     .header {
//       background-color: #19422df2;
//       color: #ffffff;
//       padding: 20px 15px;
//       text-align: center;
//       border-radius: 10px 10px 0 0;
//     }
//     .header h1 {
//       margin: 0;
//       font-size: 22px;
//       letter-spacing: 1px;
//     }
//     .content {
//       padding: 10px 20px;
//     }
//     .cta-button {
//       display: inline-block;
//       padding: 12px 24px;
//       background-color: #2d6a4f;
//       color: #FFFFFF !important;
//       text-decoration: none;
//       border-radius: 5px;
//       font-weight: bold;
//       margin: 10px 0;
//     }
//     .footer {
//       background-color: #19422df2;
//       color: #ffffff;
//       text-align: center;
//       padding: 5px 10px;
//       font-size: 12px;
//       border-radius: 0 0 10px 10px;
//     }
//     .footer-info {
//       margin-top: 6px;
//     }
//     .footer-info a {
//       color: #B6D0E2;
//       text-decoration: none;
//     }
//     .withdrawal-details {
//       background-color: #f8f8f8;
//       border-left: 4px solid #2d6a4f;
//       padding: 15px;
//       margin: 20px 0;
//     }
//     .withdrawal-details p {
//       margin: 5px 0;
//     }
//     .highlight {
//       font-weight: bold;
//       color: #0a2342;
//     }
//     .risk-warning {
//       color: #C70039;
//       padding: 5px;
//       font-size: 12px;
//       line-height: 1.4;
//     }
//     .credentials-box {
//       background-color: #eef6f9;
//       border-left: 4px solid #2d6a4f;
//       padding: 15px;
//       margin: 20px 0;
//       border-radius: 5px;
//     }
//     .credentials-box p {
//       margin: 5px 0;
//     }
// //   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <h1>Account verification</h1>
//     </div>
//     <div class="content">
//       <p>Dear Trader,</p>
//       <p>Thank you for choosing ${
//         process.env.WEBSITE_NAME || ""
//       } as your premier trading platform. We're excited to have you on board!</p>
//       <p>To get started and unlock the full potential of your trading journey, please verify your email address:</p>
//       ${credentialsBox}
//       <a href="${verificationLink}" class="cta-button">Verify Email Now</a>
//       <p>Thank you for choosing us.</p>
//       <p>Happy trading!</p>
//       <p>Best regards,<br>The ${process.env.WEBSITE_NAME || ""} Team</p>
//       <hr>
//       <div class="risk-warning">
//         <strong>Risk Warning:</strong> Trading CFDs carries high risk and may result in losses beyond your initial investment. Trade only with money you can afford to lose and understand the risks.
//         <br><br>
//         Our Trade’s services are not for U.S. citizens or in jurisdictions where they violate local laws.
//       </div>
//     </div>
//     <div class="footer">
//   <div class="footer-info">
//    <p>${process.env.EMAIL_ADDRESS || ""}</p>
//     <p>Website: <a href="https://${process.env.EMAIL_WEBSITE || ""}"> ${
//       process.env.EMAIL_WEBSITE
//     } </a> | E-mail: <a href="mailto:${process.env.EMAIL_EMAIL || ""}">${
//       process.env.EMAIL_EMAIL
//     }</a></p>
//     <p>&copy; 2025 ${process.env.WEBSITE_NAME || ""}. All Rights Reserved</p>
//   </div>
//     </div>
//   </div>
// </body>
// </html>`;

// //   // Create a verification link (use your own domain)

//   const mailOptions = {
//     from: `"${process.env.WEBSITE_NAME}" ${process.env.NODEMAILER_SENDER_EMAIL}`,
//     to: email,
//     subject: "Email Verification",
//     html: customContent,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "Verification link sent!", userStoreLink });
//   } catch (error) {
//     res.status(500).json({ message: "Error sending email", error });
//   }
// };

// Verify link---------------------------






// optional only if you still want in-memory storage
// const userStoreLink = {};

// const sendVerificationLinkController = async (req, res) => {
//   try {
//     const { email, userId, password } = req.body;

//     if (!email || !userId) {
//       return res.status(400).json({
//         message: "Email and userId are required",
//         status: false,
//       });
//     }

//     const userExist = await UserModel.findById(userId);

//     if (!userExist) {
//       return res.status(404).json({
//         message: "User not found",
//         status: false,
//       });
//     }

//     // 1) Generate RAW token
//     const verificationToken = crypto.randomBytes(32).toString("hex");

//     // 2) Hash token before saving in DB
//     const hashedVerificationToken = crypto
//       .createHash("sha256")
//       .update(verificationToken)
//       .digest("hex");

//     // 3) Save HASHED token in DB
//     userExist.token = hashedVerificationToken;
//     userExist.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
//     await userExist.save();

//     // optional memory store
//     // userStoreLink[userId] = {
//     //   verificationToken,
//     //   expiresAt: Date.now() + 60 * 60 * 1000,
//     // };

//     // 4) Send RAW token in link
//     const verificationLink = `${process.env.FRONTEND_URL}/user/verify/${userId}/${verificationToken}`;

//     const credentialsBox = password
//       ? `
//       <div class="credentials-box">
//         <p class="highlight"><strong>🔐 Your Login Credentials</strong></p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Password:</strong> ${password}</p>
//         <p style="color: #C70039;">
//           <em>Please store these details securely. Do not share with anyone.</em>
//         </p>
//       </div>
//       `
//       : "";

//     const customContent = `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//   <title>Account Verification</title>
//   <style>
//     body, html {
//       margin: 0;
//       padding: 0;
//       font-family: Arial, sans-serif;
//       line-height: 1.6;
//       color: #333;
//       background-color: #f4f4f4;
//     }
//     .container {
//       max-width: 600px;
//       margin: 0 auto;
//       padding: 5px;
//       background-color: #ffffff;
//     }
//     .header {
//       background-color: #19422df2;
//       color: #ffffff;
//       padding: 20px 15px;
//       text-align: center;
//       border-radius: 10px 10px 0 0;
//     }
//     .header h1 {
//       margin: 0;
//       font-size: 22px;
//       letter-spacing: 1px;
//     }
//     .content {
//       padding: 10px 20px;
//     }
//     .cta-button {
//       display: inline-block;
//       padding: 12px 24px;
//       background-color: #2d6a4f;
//       color: #FFFFFF !important;
//       text-decoration: none;
//       border-radius: 5px;
//       font-weight: bold;
//       margin: 10px 0;
//     }
//     .footer {
//       background-color: #19422df2;
//       color: #ffffff;
//       text-align: center;
//       padding: 5px 10px;
//       font-size: 12px;
//       border-radius: 0 0 10px 10px;
//     }
//     .footer-info {
//       margin-top: 6px;
//     }
//     .footer-info a {
//       color: #B6D0E2;
//       text-decoration: none;
//     }
//     .highlight {
//       font-weight: bold;
//       color: #0a2342;
//     }
//     .risk-warning {
//       color: #C70039;
//       padding: 5px;
//       font-size: 12px;
//       line-height: 1.4;
//     }
//     .credentials-box {
//       background-color: #eef6f9;
//       border-left: 4px solid #2d6a4f;
//       padding: 15px;
//       margin: 20px 0;
//       border-radius: 5px;
//     }
//     .credentials-box p {
//       margin: 5px 0;
//     }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <h1>Account Verification</h1>
//     </div>
//     <div class="content">
//       <p>Dear Trader,</p>
//       <p>
//         Thank you for choosing ${process.env.WEBSITE_NAME || ""} as your premier trading platform.
//         We're excited to have you on board!
//       </p>
//       <p>
//         To get started and unlock the full potential of your trading journey,
//         please verify your email address:
//       </p>

//       ${credentialsBox}

//       <a href="${verificationLink}" class="cta-button">Verify Email Now</a>

//       <p>Thank you for choosing us.</p>
//       <p>Happy trading!</p>
//       <p>Best regards,<br>The ${process.env.WEBSITE_NAME || ""} Team</p>

//       <hr>

//       <div class="risk-warning">
//         <strong>Risk Warning:</strong>
//         Trading CFDs carries high risk and may result in losses beyond your initial investment.
//         Trade only with money you can afford to lose and understand the risks.
//         <br /><br />
//         Our Trade’s services are not for U.S. citizens or in jurisdictions where they violate local laws.
//       </div>
//     </div>

//     <div class="footer">
//       <div class="footer-info">
//         <p>${process.env.EMAIL_ADDRESS || ""}</p>
//         <p>
//           Website:
//           <a href="https://${process.env.EMAIL_WEBSITE || ""}">
//             ${process.env.EMAIL_WEBSITE || ""}
//           </a>
//           |
//           E-mail:
//           <a href="mailto:${process.env.EMAIL_EMAIL || ""}">
//             ${process.env.EMAIL_EMAIL || ""}
//           </a>
//         </p>
//         <p>&copy; 2025 ${process.env.WEBSITE_NAME || ""}. All Rights Reserved</p>
//       </div>
//     </div>
//   </div>
// </body>
// </html>`;

//     const mailOptions = {
//       from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
//       to: email,
//       subject: "Email Verification",
//       html: customContent,
//     };
//     try{
//     const response=await transporter.sendMail(mailOptions);
//     if(response.status(200)|| response.status=="success"){
//       return res.status(200).json({message:"Mail sent successfully"});
//     }
//     const CustomMail=await CustomMailModel.create({
//       email,
//       subject,
//     })
//     return res.status(200).json({message:"CustomMail Sent Successfully",customMail:CustomMail});
//   }
//   catch(err){
//     return res.status(500).json({message:"Server Error",err:err.message});
//   }

//     return res.status(200).json({
//       message: "Verification link sent successfully",
//       status: true,
//       // userStoreLink, // only if you still want to expose this
//     });
//   } catch (error) {
//     console.error("Send verification link error:", error.message);
//     return res.status(500).json({
//       message: "Error sending verification email",
//       error: error.message,
//       status: false,
//     });
//   }
// };


const sendVerificationLinkController = async (req, res) => {
  try {
    const { email, userId, password } = req.body;

    if (!email || !userId) {
      return res.status(400).json({
        message: "Email and userId are required",
        status: false,
      });
    }

    const userExist = await UserModel.findById(userId);

    if (!userExist) {
      return res.status(404).json({
        message: "User not found",
        status: false,
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    userExist.token = hashedVerificationToken;
    userExist.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await userExist.save();

    const verificationLink = `${process.env.FRONTEND_URL}/user/verify/${userId}/${verificationToken}`;

    const credentialsBox = password
      ? `
      <div class="credentials-box">
        <p class="highlight"><strong>🔐 Your Login Credentials</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p style="color: #C70039;">
          <em>Please store these details securely. Do not share with anyone.</em>
        </p>
      </div>
      `
      : "";

    const customContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Verification</title>
</head>
<body>
  <div>
    <h1>Account Verification</h1>
    <p>Dear Trader,</p>
    <p>Please verify your email address:</p>
    ${credentialsBox}
    <a href="${verificationLink}">Verify Email Now</a>
  </div>
</body>
</html>`;

    const mailOptions = {
      from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
      to: email,
      subject: "Email Verification",
      html: customContent,
    };

    const response = await transporter.sendMail(mailOptions);

    if (!response) {
      return res.status(500).json({
        message: "Failed to send verification email",
        status: false,
      });
    }

    await CustomMailModel.create({
      emailId:email,
      subject: "Email Verification",
      // type: "account-verification",
      // status: "sent",
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalMailCountToday = await CustomMailModel.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return res.status(200).json({
      message: "Verification link sent successfully",
      status: true,
      totalMailCountToday,
    });
  } catch (error) {
    console.error("Send verification link error:", error.message);
    return res.status(500).json({
      message: "Error sending verification email",
      error: error.message,
      status: false,
    });
  }
};

 const verifyEmailController = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        msg: "User id and token are required",
        status: false,
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
        status: false,
      });
    }

    if (!user.token) {
      return res.status(400).json({
        msg: "Verification token not found",
        status: false,
      });
    }

    // hash incoming RAW token
    const hashedIncomingToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    if (user.token !== hashedIncomingToken) {
      return res.status(400).json({
        msg: "Invalid token",
        status: false,
      });
    }

    if (!user.tokenExpiry || user.tokenExpiry < new Date()) {
      return res.status(400).json({
        msg: "Token expired",
        status: false,
      });
    }

    user.emailVerified = true;
    user.token = null;
    user.tokenExpiry = null;

    await user.save();

    return res.status(200).json({
      msg: "Email verified successfully",
      status: true,
    });
  } catch (error) {
    console.error("Verify email error:", error.message);
    return res.status(500).json({
      msg: "Internal Server Error",
      error: error.message,
      status: false,
    });
  }
};



// add or update wallet details --------

const addOrUpdateWalletDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tetherAddress, ethAddress, trxAddress, accountNumber } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          walletDetails: {
            tetherAddress,
            ethAddress,
            trxAddress,
            accountNumber,
          },
        },
      },
      { new: true, upsert: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Wallet details added/updated", updatedUser });
  } catch (error) {
    console.error("Error in addOrUpdateWalletDetails:", error);
    res.status(500).json({
      message: "Error adding/updating wallet details",
      error: error.message,
    });
  }
};



// add or update bank details --------

const addOrUpdateBankDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      bankName,
      holderName,
      accountNumber,
      ifscCode,
      swiftCode,
      upiId,
      comment,
    } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          bankDetails: {
            bankName,
            holderName,
            accountNumber,
            ifscCode,
            swiftCode,
            upiId,
            comment,
          },
        },
      },
      { new: true, upsert: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Bank details added/updated", updatedUser });
  } catch (error) {
    console.error("Error in addOrUpdateBankDetails:", error);
    res.status(500).json({
      message: "Error adding/updating Bank details",
      error: error.message,
    });
  }
};
// add or update kyc details --------

const addOrUpdateKycDetails = async (req, res) => {
  try {
    uploadFields(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: "File upload error", error: err.message });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "Unknown error", error: err.message });
      }

      const { userId } = req.params;
      const { documentType, countryOfIssue, purpose, occupation, status } =
        req.body;

      // Fetch existing user to preserve old image paths if no new image is uploaded
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const prevKyc = existingUser.kycDetails || {};

      const kycDetails = {
        documentType: documentType || prevKyc.documentType,
        countryOfIssue: countryOfIssue || prevKyc.countryOfIssue,
        purpose: purpose || prevKyc.purpose,
        occupation: occupation || prevKyc.occupation,
        status: status || prevKyc.status,
        frontSideOfDocument: prevKyc.frontSideOfDocument,
        backSideOfDocument: prevKyc.backSideOfDocument,
        selfieWithDocument: prevKyc.selfieWithDocument,
      };

      // Override only if new files are uploaded
      try {
        if (req.files) {
          console.log("request files", req.files);
          if (req.files.frontSideOfDocument) {
            await validateAndSanitizeImage(
              req.files.frontSideOfDocument[0].path,
            );
            kycDetails.frontSideOfDocument =
              req.files.frontSideOfDocument[0].path;
          }
          if (req.files.backSideOfDocument) {
            await validateAndSanitizeImage(
              req.files.backSideOfDocument[0].path,
            );
            kycDetails.backSideOfDocument =
              req.files.backSideOfDocument[0].path;
          }
          if (req.files.selfieWithDocument) {
            await validateAndSanitizeImage(
              req.files.selfieWithDocument[0].path,
            );
            kycDetails.selfieWithDocument =
              req.files.selfieWithDocument[0].path;
          }
        }
      } catch (e) {
        console.log("error", e);
      }

      console.log("request files", req.files);

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { kycDetails } },
        { new: true, upsert: true },
      );

      return res
        .status(200)
        .json({ message: "KYC details added/updated", updatedUser });
    });
  } catch (error) {
    console.error("Error in addOrUpdateKycDetails:", error);
    res.status(500).json({
      message: "Error adding/updating KYC details",
      error: error.message,
    });
  }
};

// update kyc status
const updateKycStatusController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ msg: "KYC status is required" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { "kycDetails.status": status } },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "KYC status updated successfully",
      data: updatedUser.kycDetails,
    });
  } catch (error) {
    console.error("Error updating KYC status:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
// ----------------------

const withdrawIBBalanceController = async (req, res) => {
  try {
    const { referralAccount, amount } = req.body;

    // Basic validations
    if (!referralAccount || amount === undefined) {
      return res
        .status(400)
        .json({ msg: "Referral account and amount are required" });
    }

    const withdrawalAmount = Number(amount);

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ msg: "Invalid withdrawal amount" });
    }

    // Find user by referral ID
    const user = await UserModel.findOne({ referralAccount });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.ibBalance < withdrawalAmount) {
      return res.status(400).json({ msg: "Insufficient IB balance" });
    }

    // Deduct the amount from ibBalance
    user.ibBalance -= withdrawalAmount;
    await user.save();

    return res.status(200).json({
      msg: "Withdrawal successful",
      newBalance: user.ibBalance,
    });
  } catch (err) {
    console.error("Error in withdrawFromIBBalance:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// add account to user ------

// send custom mail -------------------

// controllers/UserController.js    //single user  //allusers
const sendCutomMailController = async (req, res) => {
  //Request mein passed
  const { email, content, subject } = req.body;

  if (!email || !content || !subject) {
    return res.status(400).json({
      message: "Email, subject and content are required",
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
      to: email,
      subject,
      html: content,
    });

    const createModel = await CustomMailModel.create({
      emailId: email,
      subject,
    });

    //One day no of emails sent 
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalMailCountToday = await CustomMailModel.countDocuments({
      emailId: email,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return res.status(200).json({
      message: "Custom mail sent successfully",
      messageId: info.messageId,
      model: createModel,
      totalMailCountToday,
    });
  } catch (error) {
    console.log("Custom mail error:", error);
    return res.status(500).json({
      message: "Error sending custom mail",
      error:error.message,
    });
  }
};


const sendCustomMailAllUsers = async (req, res) => {

  const { subject, content } = req.body;

  if (!subject || !content) {
    return res.status(400).json({
      message: "Subject and content are required",
    });
  }
//Fetching all the users
  try {

    const users = await UserModel.find({}, { email: 1 });
    //Fetching single user

    for (const user of users) {
      if (!user.email) continue;

      await transporter.sendMail({
        from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
        to: user.email,
        subject,
        html: content,
      });

      //CustomMail in Model craete
      await CustomMailModel.create({
        emailId: user.email,
        subject,
      });
    }

    //Total count of emails
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalMailCountToday = await CustomMailModel.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Mail sent to all users successfully",
      totalUsers: users.length,
      totalMailCountToday,
    });
  } catch (error) {
    console.log("All users mail error:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending mail to all users",
      error: error.message,
    });
  }
};

const sendCutomMailForMT5 = async ({ email, content, subject }) => {
  const mailOptions = {
    from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
    to: email,
    subject,
    html: content,
  };
  try {
    const response=await transporter.sendMail(mailOptions);
    if(!response){
      return {success:"false",message:"Server Error"};
    }
    const CustomModel=await CustomMailModel.create({
      emailId:email,
      subject:subject,
    })
    //Total No.of users in 1 day
    const startofDay=new Date();
    startofDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalMailCountToday = await CustomMailModel.countDocuments({
      createdAt: {
        $gte: startofDay,
        $lte: endOfDay,
      },
    });
    // return { success: true };
    return {message:"Custom Mail for MT5 sent successfully",CustomModel,totalMailCountToday};
  } catch (error) {
    console.log("error is",error);
    return { success: false, error:error.message };
  }
};

const addMt5AccountCreation = async (userId, accountData) => {
  const {
    accountNumber,
    leverage,
    accountType,
    groupName,
    masterPassword,
    investorPassword,
    platform,
  } = accountData;

  console.log(accountData);

  try {
    const user = await UserModel.findById(userId);
    // If user does not exist, return an error
    if (!user) throw new Error("User not found");

    if (accountNumber) {
      // 1. Check if referralAccount is already used by another user's referralAccount
      const referralExists = await UserModel.findOne({
        referralAccount: accountNumber,
      });

      if (referralExists)
        throw new Error(
          `Account id '${accountNumber}' is already in use as referralAccount.`,
        );

      // 2. Check if referralAccount matches any user's accountNumber
      const accountExist = await UserModel.findOne({
        "accounts.accountNumber": accountNumber,
      });

      if (accountExist)
        throw new Error(
          `Account id '${accountNumber}' is already in use as an account number.`,
        );
    }
    // Create the new account object
    const newAccount = {
      accountNumber,
      leverage,
      accountType,
      groupName,
      masterPassword,
      investorPassword,
      platform,
    };
    user.accounts.push(newAccount);
    await user.save();

    return newAccount;
  } catch (error) {
    console.error("Error adding account:", error.message);
    throw error;
  }
};




// const SessionModel = require("../models/user/SessionModel");



function CFgenerateRandomNumber(digits) {
  if (digits <= 0) throw new Error("Digits must be a positive number");
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const addMt5AccountController = async (req, res) => {
  const { userId } = req.params;
  const {
    leverage,
    accountType,
    groupName,
    platform,
    siteConfig,
    VITE_MANAGER_INDEX,
    VITE_WEBSITE_NAME,
    VITE_EMAIL_WEBSITE,
  } = req.body;
  try {
    let newAccount = {};
    const user = await UserModel.findById(userId);

    // If user does not exist, return an error
    if (!user) {
      return res.status(404).json({ msg: "User not found", code: 103 });
    }

    let retries = 0;
    let accountCreated = false;

    while (retries < 5 && !accountCreated) {
      const randomNumber = CFgenerateRandomNumber(siteConfig?.mt5Digit || 6);
      let accountExists = false;
      const index = VITE_MANAGER_INDEX || 1;

      console.log("index-------------------------------------------->", index);
      console.log("randomNumber--------------------->", randomNumber);

      try {
        const check = await axios.get(
          `${process.env.META_API_BASE_URL}/GetUserInfo?Manager_Index=${index}&MT5Account=${randomNumber}`,
          {
            headers: {
              "x-api-key": process.env.META_API_KEY, // <-- apna key yahan se
            },
            withCredentials: true, // ✅ yahan
          },
        );

        console.log("checkkkk", check);

        if (check.data.MT5Account) {
          accountExists = true;
          retries++;
          continue;
        }
      } catch (error) {
        console.log("errogggr", error.response);
        console.log("ggggerror", error.response.status);

        if (error.response && error.response.status !== 404) {
          console.log("error", error.response);
          console.log("error", error.response.status);
          retries++;
        }
      }

      try {
        const apiRes = await axios.post(
          `${process.env.META_API_BASE_URL}/Adduser`,
          {
            Manager_Index: index,
            MT5Account: randomNumber,
            Name: `${user.firstName} ${user.lastName}`,
            Country: user.country,
            Leverage: leverage,
            Group_Name: groupName,
          },

          {
            headers: {
              "x-api-key": process.env.META_API_KEY, // <-- apna key yahan se
            },
            withCredentials: true, // ✅ yahan
          },
        );

        const mt5Account = apiRes.data.MT5Account;
        if (mt5Account > 0) {
          if (mt5Account) {
            // 1. Check if referralAccount is already used by another user's referralAccount
            const referralExists = await UserModel.findOne({
              referralAccount: mt5Account,
            });

            if (referralExists) {
              return res.status(500).json({
                message: `Account id '${mt5Account}' is already in use as referralAccount.`,
              });
            }

            // 2. Check if referralAccount matches any user's accountNumber
            const accountExist = await UserModel.findOne({
              "accounts.accountNumber": mt5Account,
            });

            if (accountExist) {
              return res.status(500).json({
                message: `Account id '${mt5Account}' is already in use as an account number.`,
              });
            }
          }

          newAccount = {
            accountNumber: mt5Account,
            leverage,
            accountType,
            groupName,
            masterPassword: apiRes.data.Master_Pwd,
            investorPassword: apiRes.data.Investor_Pwd,
            platform,
          };

          user.accounts.push(newAccount);
          await user.save();

          try {
            const loggedUser = {
              firstName: user.firstName,
              lastName: user.lastName,
            };

            const formData = {
              platform,
              leverage,
              accountType,
            };

            const emailContent = OpenAccountMail({
              loggedUser,
              generateMt5: apiRes,
              formData,
              siteConfig,
              VITE_WEBSITE_NAME,
              VITE_EMAIL_WEBSITE,
            });

            const mailResult = await sendCutomMailForMT5({
              email: user.email,
              content: emailContent,
              subject: "Account Created",
            });

            if (!mailResult.success) console.error(mailResult.error);
          } catch (mailErr) {
            console.error("Email failed:", mailErr);
          }

          accountCreated = true;
        } else retries++;
      } catch {
        retries++;
      }
    }

    if (!accountCreated) return res.status(500).json({ message: "error" });

    return res.status(200).json({
      message: "MT5 account created successfully",
      account: newAccount,
    });
  } catch (error) {
    console.error("Error in addMt5AccountController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const logOutUserController = async (req, res) => {
//   try {
//     const accessToken = req.cookies.accessToken;

//     // 1️⃣ Check token exists
//     if (!accessToken) {
//       return res.status(401).json({
//         message: "Already logged out",
//       });
//     }

//     // 2️⃣ Verify token
//     let decoded;
//     try {
//       decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({
//         message: "Invalid or expired token",
//       });
//     }

//     // 3️⃣ Revoke session in DB  
//     await SessionModel.updateOne(
//       { sessionId: decoded.sessionId },
//       { isRevoked: true }
//     );

//     // 4️⃣ Clear cookies
//     res.clearCookie("accessToken");  
//     res.clearCookie("refreshToken");

//     // 5️⃣ Send response
//     return res.status(200).json({
//       message: "Logout successful",
//     });

//   } catch (error) {
//     return res.status(500).json({
//       message: "Logout failed",
//     });
//   }
// };

const clientlogOutUserController = async (req, res) => {
  try {

    const token = req.cookies.userat;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      await SessionModel.updateOne(
        { sessionId: decoded.sessionId },
        { isRevoked: true }
      );
    }

    // Clear ALL cookies (role check ki zarurat nahi)

    // res.clearCookie("sact", {
    //   httpOnly: true,
    //   secure: false,   // localhost pe false
    //   sameSite: "strict",
    // });

    // res.clearCookie("adminut", {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "strict",
    // });

    // res.clearCookie("adminrt", {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "strict",
    // });

    res.clearCookie("userat", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.clearCookie("userrt", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.json({ success: true });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


const clientrefreshTokenController = async (req, res) => {
  try {

    // 1️⃣ Detect which refresh token exists
    const refreshToken =
      req.cookies.userrt 

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token missing",
      });
    }

    // 2️⃣ Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET
      );
    } catch (err) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // 3️⃣ Check session in DB
    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
      refreshToken,
      isRevoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "Session invalid",
      });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    // 4️⃣ Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        role: decoded.role,
        sessionId: decoded.sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 5️⃣ Set correct cookie based on role
    if (decoded.role === "users") {
      res.cookie("userat", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
    }

    if (decoded.role === "adminusers") {
      res.cookie("adminut", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
    }

    if (decoded.role === "superadminusers") {
      res.cookie("sact", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
    }

    return res.json({
      message: "Access token refreshed",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};


const adminlogOutUserController = async (req, res) => {
  try {

    const token = req.cookies.adminut;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      await SessionModel.updateOne(
        { sessionId: decoded.sessionId },
        { isRevoked: true }
      );
    }

    // Clear ALL cookies (role check ki zarurat nahi)

    // res.clearCookie("sact", {
    //   httpOnly: true,
    //   secure: false,   // localhost pe false
    //   sameSite: "strict",
    // });

    // res.clearCookie("adminut", {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "strict",
    // });

    // res.clearCookie("adminrt", {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "strict",
    // });

    res.clearCookie("adminut", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.clearCookie("adminrt", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.json({ success: true });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


   
const superadminlogOutUserController = async (req, res) => {
  try {

    const token = req.cookies.adminat;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      await SessionModel.updateOne(
        { sessionId: decoded.sessionId },
        { isRevoked: true }
      );
    }

    // Clear ALL cookies (role check ki zarurat nahi)

    // res.clearCookie("sact", {
    //   httpOnly: true,
    //   secure: false,   // localhost pe false
    //   sameSite: "strict",
    // });

    // res.clearCookie("adminut", {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "strict",
    // });

    // res.clearCookie("adminrt", {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "strict",
    // });

    res.clearCookie("sact", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.json({ success: true });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};




const adminrefreshTokenController = async (req, res) => {
  try {

    // 1️⃣ Detect which refresh token exists
    const refreshToken =
      req.cookies.userrt 

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token missing",
      });
    }

    // 2️⃣ Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET
      );
    } catch (err) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // 3️⃣ Check session in DB
    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
      refreshToken,
      isRevoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "Session invalid",
      });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    // 4️⃣ Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        role: decoded.role,
        sessionId: decoded.sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 5️⃣ Set correct cookie based on role
    if (decoded.role === "users") {
      res.cookie("userat", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
    }

    if (decoded.role === "adminusers") {
      res.cookie("adminut", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
    }

    if (decoded.role === "superadminusers") {
      res.cookie("sact", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
    }

    return res.json({
      message: "Access token refreshed",
    });  

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};


const userInfoController = async (req, res) => {
  try {
    const user = req.auth; // JWT middleware se aaya

    if (!user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fetch_userData = await UserModel.findById(user.sub).select("-password");

    if (!fetch_userData) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: fetch_userData
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error?.message
    });
  }
};

const UserLoginByAdminController = async (req, res) => {
  const {id}=req.params;


  try {
    // Find the user by email
    const user = await UserModel.findById(id);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid id" });
    }


   let sessionId;
let sessionExists = true;
let attempts = 0;

while (sessionExists && attempts < 5) {
  sessionId = crypto.randomBytes(16).toString("hex");

  const found = await SessionModel.findOne({ sessionId });

  if (!found) {
    sessionExists = false; // unique mil gaya
  }

  attempts++;


    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: "users",
        sessionId: sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "16m" },
    );

    console.log("token");

    const refreshToken = jwt.sign(
      {
        userId: user._id,
        role: "users",
        sessionId,
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "1hr" },
    );

    user.refreshToken = refreshToken;
    await user.save();


    const data = await SessionModel.create({
      userId: user._id,
      sessionId: sessionId,
      role: "users",

      expiresAt: new Date(Date.now() +  60 * 60 * 1000), //1 hr ///refresh token expiry time
    });


    // 🍪 Secure cookies
    res.cookie("userat", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15* 60 * 1000, //10min
    });

    res.cookie("userrt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, //1hr
    });

    res.json({
      msg: "User logged in successfully",
      user: user,
    });
  }
 } catch (error) {
    console.error("Error", error);
    res.status(500).json({ message: "Server error",error:error.message });
  }
};

const sAdminLoginAdminController=async(req,res)=>{
  try{
    const admin_id=process.env.Admin_ID;
    if(!admin_id){
     return res.status(401).json({message:"Admin Id not found"});
    }

    let sessionId;
    let sessionExists=true;
    while(sessionExists){
      sessionId=crypto.randomBytes(16).toString("hex");

       const found = await SessionModel.findOne({ sessionId });

  if (!found) {
    sessionExists = false; // unique mil gaya
  }

  const accessToken = jwt.sign(
      {
        userId: admin_id,
        role: "users",
        sessionId: sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "16m" },
    );

    console.log("token");

    const refreshToken = jwt.sign(
      {
        userId: admin_id,
        role: "adminusers",
        sessionId,
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "1hr" },
    );

    // admin_id.refreshToken = refreshToken;
    // await admin_id.save();


    const data = await SessionModel.create({
      userId: admin_id,
      sessionId: sessionId,
      role: "adminusers",

      expiresAt: new Date(Date.now() +  60 * 60 * 1000), //1 hr ///refresh token expiry time
    });


    // 🍪 Secure cookies
    res.cookie("adminut", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15* 60 * 1000, //10min
    });

    res.cookie("adminrt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, //1hr
    });

    res.json({
      msg: "Admin logged in successfully",
    });
  }
 } catch (error) {
    console.error("Error", error);
    res.status(500).json({ message: "Server error",error:error.message });
  }
};


  // const getMasterAccountsController = async (req, res) => {
  //   try {
  //     const user = await UserModel.find();
  
  //     const newArray = user.accounts.flatMap((user)=>{
  //       user.accounts=map((ele)=>ele.accountNumber=String(ele.accountNumber))
  //     })
  
  
  //     const externalResponse = await copyClient.post(
  //       `/api/getMasterDetailsByAccounts`,
  //       {
  //         userId: parseInt(process.env.User_Id),
  //         masterAccounts : newArray
  //       }
  //     );
  
  
  
  //     return res.status(200).json({
  //       success: true,
  //       data: externalResponse.data.masterAccountsData || [],
  //       message: "masters listed successfully",
  // // userq : newArray,
  //     });
  //   } catch (error) {
  //     console.error("Get masters error:", error.response?.data || error.message);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Server error while fetching masters",
  //       error: error.response?.data || error.message,
  //     });
  //   }
  // };


  const getMasterAccountsController = async (req, res) => {
  try {
    const users = await UserModel.find({}, "accounts");

    const newArray = users.flatMap((user) =>
      (user.accounts || []).map((ele) => String(ele.accountNumber))
    );

    const externalResponse = await copyClient.post(
      `/api/getMasterDetailsByAccounts`,
      {
        userId: parseInt(process.env.User_Id),
        masterAccounts: newArray,
      }
    );

    return res.status(200).json({
      success: true,
      data: externalResponse.data.masterAccountsData || [],
      message: "masters listed successfully",
      // userq: newArray,
    });
  } catch (error) {
    console.error("Get masters error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching masters",
      error: error.response?.data || error.message,
    });
  }
};





module.exports = {
  registerUserController,
  loginUserController,
  clientlogOutUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  updateUserController,
  sendVerificationLinkController,
  verifyEmailController,
  addOrUpdateWalletDetails,
  addOrUpdateBankDetails,
  addOrUpdateKycDetails,
  sendCutomMailController,
  getUserByEmailController,
  sendForgotPasswordController,
  resetPasswordController,
  addMt5AccountController,
  updatePasswordController,
  getKycUsersController,
  updateKycStatusController,
  withdrawIBBalanceController,
  getUsersListController,
  clientrefreshTokenController,
  adminrefreshTokenController,
  adminlogOutUserController,
  superadminlogOutUserController,
  userInfoController,
  UserLoginByAdminController,
  sAdminLoginAdminController,
  getAdminUserByIdController,
  sendCustomMailAllUsers,
  getMasterAccountsController,
};
