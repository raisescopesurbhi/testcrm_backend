const adminUserModel = require("../models/admin/adminUserModel");
const SessionModel = require("../models/user/SessionModel");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

// const sessionId = crypto.randomBytes(16).toString("hex");

const createOrUpdateAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await adminUserModel.findOneAndUpdate(
      {}, // No filter, since we want only one document
      { email, password }, // Update email and password
      { upsert: true, new: true }, // Create if not exists, return the updated document
    );
    res.json({ message: "Admin user created/updated successfully", admin });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const adminLoginController = async(req, res) => {
//     const { email, password } = req.body;

//     console.log("password is",password);

//     try {
//         if (!email || !password) {
//             return res.json({ msg: "Please fill all the fields", status: false });
//         }

//         const userExist = await adminUserModel.findOne({ email: email });
//         console.log("UserExist",userExist);
//         if (!userExist) {
//             return res.json({ msg: "Invalid email or password.", status: false, userExist });
//         }

//         //  Compare hashed password with entered password
//          const isMatch = userExist.password;
//          if (!isMatch) {
//            return res.json({ msg: "Invalid email or password.", status: false });
//          }

//     //      if (!isMatch) {
//     //   userExist.loginAttempts += 1;

//     //   if (userExist.loginAttempts >= 5) {
//     //     userExist.lockUntil = Date.now() + 30 * 60 * 1000;
//     //   }

//     //   await userExist.save();

//     //   return res.status(401).json({
//     //     message: "Invalid email or password",
//     //     status: false,
//     //   });
//     // }

//     // Reset attempts if correct
//     // userExist.loginAttempts = 0;
//     // userExist.lockUntil = null;

//     // if (!userExist.emailVerified) {
//     //   return res.status(403).json({
//     //     message: "Email not verified",
//     //   });
//     // }

//     //const s_id =getSessionId()
//     //databse exist or not
//     //const sessionId=

//     //unique session Id must exists in session modell..
//     //then return and store it..
//     //maximum 5 times retry..

//     let sessionId;
// let sessionExists = true;
// let attempts = 0;

// while (sessionExists && attempts < 5) {
//   sessionId = crypto.randomBytes(16).toString("hex");

//   const found = await SessionModel.findOne({ sessionId });

//   if (!found) {
//     sessionExists = false; // unique mil gaya
//   }

//   attempts++;

// const accessToken = jwt.sign(
//   {
//     userId: userExist._id,
//     role: "adminusers",
//     sessionId:sessionId,
//   },
//   process.env.JWT_SECRET,
//   { expiresIn: "16m" }
// );

//   console.log("token");

//   const refreshToken = jwt.sign(
//   {
//     userId: userExist._id,
//     role: "adminusers",
//     sessionId:sessionId,
//   },
//   process.env.REFRESH_SECRET,
//   { expiresIn: "1hr" }
// );

// const data= await SessionModel.create({
//   userId: userExist._id,
//   sessionId:sessionId,
//   role: "adminusers",

//   expiresAt: new Date(Date.now() + 60 * 60 * 1000) //1 hr
// });

//       userExist.refreshToken = refreshToken;
//       await userExist.save();

//       res.cookie("adminut", accessToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: 15* 60 * 1000,  //10min
//     });

//     res.cookie("adminrt", refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: 60 * 60 * 1000,//1hr
//     });

//         return res.json({
//             msg: "Admin logged in successfully",
//             status: true,
//             userExist,
//         });
//     }
//  } catch (error) {
//         console.error("Error in admin login", error);
//         return res.json({ status: false, msg: "Admin login failed", error });
//     }
// };

const adminLoginController = async (req, res) => {
  const { email, password } = req.body;

  console.log("email", email);
  console.log("password", password);

  try {
    if (!email || !password) {
      return res.status(400).json({
        msg: "Please fill all the fields",
        status: false,
      });
    }

    const userExist = await adminUserModel.findOne({ email });

    if (!userExist) {
      return res.status(401).json({
        msg: "Invalid email or password.",
        status: false,
      });
    }

    // correct password compare
    // const isMatch = await bcrypt.compare(password, userExist.password);

    // if (!isMatch) {
    //   return res.status(401).json({
    //     msg: "Invalid email or password.",
    //     status: false,
    //   });
    // }

    let sessionId;
    let sessionExists = true;
    let attempts = 0;

    while (sessionExists && attempts < 5) {
      sessionId = crypto.randomBytes(16).toString("hex");

      const found = await SessionModel.findOne({ sessionId });

      if (!found) {
        sessionExists = false;
      }

      attempts++;
    }

    if (sessionExists) {
      return res.status(500).json({
        msg: "Could not generate unique session ID",
        status: false,
      });
    }

    const accessToken = jwt.sign(
      {
        userId: userExist._id,
        role: "adminusers",
        sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "16m" },
    );

    const refreshToken = jwt.sign(
      {
        userId: userExist._id,
        role: "adminusers",
        sessionId,
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "1h" },
    );

    await SessionModel.create({
      userId: userExist._id,
      sessionId,
      role: "adminusers",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    userExist.refreshToken = refreshToken;
    await userExist.save();

    res.cookie("adminut", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie("adminrt", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hr
    });

    return res.status(200).json({
      msg: "Admin logged in successfully",
      status: true,
      user: {
        _id: userExist._id,
        password: userExist.password,
        email: userExist.email,
        role: "adminusers",
      },
    });
  } catch (error) {
    console.error("Error in admin login", error);
    return res.status(500).json({
      status: false,
      msg: "Admin login failed",
      error: error.message,
    });
  }
};

const adminGetUserController = async (req, res) => {
  try {
    const user = await adminUserModel.findOne();

    return res.json({
      msg: "Retrieved successfully",
      status: true,
      data: user,
    });
  } catch (error) {
    console.log("error in admin login", error);
    return res.json({ status: false, msg: "Retrieving failed" });
  }
};

module.exports = {
  createOrUpdateAdmin,
  adminLoginController,
  adminGetUserController,
};
