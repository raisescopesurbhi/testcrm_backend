const DepositModel = require("../models/user/DepositModel");

const axios = require("axios");
const qs = require("qs");

const multer = require("multer");
const path = require("path");
const transporter = require("../config/user/emailTransportal");
const { getDepositDecisionMail } = require("../emails/depositDecisionMail");

// Configure storage for images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/deposits/"); // Changed folder to uploads/deposits
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Save image with a timestamp
  },
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .png, and .gif formats are allowed!"), false);
  }
};
// Initialize multer with the defined storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// add deposit ---------------

// const addDepositController = async (req, res) => {
//   upload.single("depositSS")(req, res, async function (err) {
//     if (err) {
//       console.log(err);
//       return res
//         .status(400)
//         .json({ message: "Error uploading file", error: err });
//     }

//     try {
//       const Body = req.body;

//       const depositSS = req.file ? req.file.path : null;

//       const newSaved = await DepositModel.create({
//         mt5Account: Body.mt5Account,
//         deposit: Body.deposit,
//         status: Body.status,
//         userId: Body.userId,
//         accountType: Body.accountType,
//         depositSS: depositSS, // Add the image path here
//         method: Body.method,
//         transactionId: Body.transactionId,
//       });

//       return res.json({
//         message: "Deposit added successfully",
//         data: newSaved,
//       });
//     } catch (error) {
//       console.error("Error during new deposit:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   });
// };

const addDepositController = async (req, res) => {
  upload.single("depositSS")(req, res, async function (err) {
    if (err) {
      console.log(err);
      return res
        .status(400)
        .json({ message: "Error uploading file", error: err });
    }

    try {
      const Body = req.body;
      const depositSS = req.file ? req.file.path : null;
        const newSaved = await DepositModel.create({
        mt5Account: Body.mt5Account,
        deposit: Body.deposit,
        status: Body.status,
        userId: Body.userId,
        accountType: Body.accountType,
        depositSS: depositSS, // Add the image path here
        method: Body.method,
        transactionId: Body.transactionId,
        lastBalance: Body.lastBalance,
      });

      console.log("newSaved" , newSaved);
      
      return res.json({
        message: "Deposit added successfully",
        data: newSaved,
      });

    } catch (error) {
      console.error("Error during deposit:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
};

// const createPaymentController = async (req, res) => {
//   const number = Date.now().toString(); // or your order ID from DB

//   const userId = req.body.userId;
//   const mt5Account = req.body.mt5Account;
//   const accountType = req.body.accountType || "real";

//   // Your USDC Wallet Address (Polygon) and Callback URL
//   const USDC_WALLET_ADDRESS = "0xdD07032e77b6d55f1AaF74505A6a556864624e5F";
//   const CALLBACK_URL = `http://localhost:4000/api/auth/paygate/payment-callback?number=${number}&userId=${userId}&mt5Account=${mt5Account}&accountType=${accountType}`;

//   try {
//     const url = `https://api.paygate.to/control/wallet.php?address=${USDC_WALLET_ADDRESS}&callback=${encodeURIComponent(
//       CALLBACK_URL
//     )}`;
//     const response = await axios.get(url);
//     res.json({ wallet: response.data });
//   } catch (error) {
//     console.error("Wallet Generation Error:", error.message);
//     res.status(500).json({ error: "Failed to create wallet" });
//   }
// };

// const paymentcallbackController = async (req, res) => {
//   const { number, userId, mt5Account, accountType, ...rest } = req.query;

//   console.log("✅ Payment Callback Received:");
//   console.log(req.query);

//   // Create a new deposit entry
//   try {
//     const newDeposit = new DepositModel({
//       mt5Account,
//       deposit: rest.amount || "0", // assuming 'amount' is returned in callback
//       status: rest.status || "pending",
//       userId,
//       accountType,
//       method: "PayGate",
//       transactionId: rest.txid || number, // fallback to number if no txid
//     });

//     await newDeposit.save();
//     res.status(200).send("Callback received and deposit saved");
//   } catch (error) {
//     console.error("❌ Error saving deposit:", error.message);
//     res.status(500).send("Failed to save deposit");
//   }
// };

// ******************

// Create a new crypto payment

// *********************************Pay Now Start*****************************************************




const createPaymentController = async (req, res) => {
  const number = Date.now().toString(); // unique order id
  const { userId, mt5Account, accountType = "real", amount } = req.body;

  console.log("Incoming Request:", req.body);

  const callBackurl = `http://localhost:4000/api/auth/nowpayments/payment-callback?number=${number}&userId=${userId}&mt5Account=${mt5Account}&accountType=${accountType}`;
  console.log("Callback URL:", callBackurl);

  try {
    // 🔹 Create payment request to NOWPayments
    const response = await axios.post(
      "https://api.nowpayments.io/v1/payment",
      {
        price_amount: amount, // e.g. 100
        price_currency: "usd", // base fiat
        pay_currency: "btc", // user pays in BTC
        ipn_callback_url: callBackurl,
        order_id: number,
        order_description: `Deposit for MT5 Account ${mt5Account}`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      },
      {
        headers: {
          "x-api-key": process.env.NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // 🔹 Save transaction to DB
    const newDeposit = new DepositModel({
      mt5Account,
      deposit: amount,
      status: response.data.payment_status || "waiting", // default waiting
      userId,
      accountType,
      method: "NOWPayments", // since BTC via NowPayments
      transactionId: response.data.payment_id?.toString(), // store NP payment ID
    });

    await newDeposit.save();

    // ✅ Send response back to frontend
    res.json({
      success: true,
      payment: response.data,
      dbRecord: newDeposit,
    });
  } catch (error) {
    console.error("NOWPayments Error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || "Failed to create payment",
    });
  }
};

const nowPaymentsCallbackController = async (req, res) => {
  try {
    const {
      order_id,
      payment_id,
      payment_status, // "waiting", "confirmed", "finished", "failed"
    } = req.body;

    console.log("NOWPayments IPN received:", req.body);

    // Find the deposit record in DB using payment_id or order_id
    const depositRecord = await DepositModel.findOne({
      transactionId: payment_id?.toString() || order_id,
    });

    if (!depositRecord) {
      console.error("Deposit record not found:", payment_id || order_id);
      return res.status(404).json({ error: "Deposit record not found" });
    }

    // Only update if status has changed
    if (depositRecord.status !== payment_status) {
      depositRecord.status = payment_status;
      await depositRecord.save();
      console.log("Deposit record updated:", depositRecord);

      // Emit real-time update to room (payment_id)
      const io = req.app.get("io");
      io.to(depositRecord.transactionId).emit("paymentUpdate", {
        payment_id: depositRecord.transactionId,
        status: payment_status,
      });

      // Auto-credit MT5 account
      if (payment_status === "finished") {
        await creditUserMT5Account(
          depositRecord.userId,
          depositRecord.mt5Account,
          depositRecord.deposit
        );
        console.log(
          `MT5 account ${depositRecord.mt5Account} credited successfully.`
        );
      }
    } else {
      console.log("Payment status unchanged, skipping update.");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in NOWPayments callback:", error);
    res.status(500).json({ error: "Server error in callback" });
  }
};

const creditUserMT5Account = async (userId, mt5Account, amount) => {
  console.log(
    `Crediting MT5 account ${mt5Account} of user ${userId} with $${amount}`
  );
  // Add your MT5 API call or DB update logic here
};




// *********************************Pay Now End*****************************************************

// ✅ Callback from PayNow Provider
const paymentcallbackController = async (req, res) => {
  const { number, userId, mt5Account, accountType } = req.query;
  const { status, amount, transactionId } = req.body; // depends on provider webhook format

  console.log("✅ PayNow Callback Received:", req.body);

  try {
    const newDeposit = new DepositModel({
      mt5Account,
      deposit: amount || "0",
      status: status === "COMPLETED" ? "success" : "pending",
      userId,
      accountType,
      method: "PayNow",
      transactionId: transactionId || number,
    });

    await newDeposit.save();
    res.status(200).send("PayNow callback received and deposit saved");
  } catch (error) {
    console.error("❌ Error saving PayNow deposit:", error.message);
    res.status(500).send("Failed to save PayNow deposit");
  }
};

// Get all deposits -------------

// const getDepositDataController = async (req, res) => {
//   try {
//     const data = await DepositModel.find().populate("userId");
//     res.json({ msg: "All deposits data retrived successfully", data });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ msg: "Failed to reterived deposits", error: error.message });
//   }
// };

const getDepositDataController = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;

    let query = {};

    // Apply search filter (name, email, mt5Account)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mt5Account: { $regex: search, $options: "i" } },
      ];
    }

    // Apply status filter (pending, approved, rejected)
    if (status) {
      query.status = status; // Will match exactly the provided status value
    }

    // If pagination is provided, apply it
    if (page && limit) {
      const pageNumber = parseInt(page) || 1;
      const limitNumber = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const data = await DepositModel.find(query)
        .populate("userId")
        .sort({ updatedAt: -1 }) // Sort by latest updatedAt first
        .skip(skip)
        .limit(limitNumber);

      const total = await DepositModel.countDocuments(query);

      return res.json({
        msg: "Deposits retrieved successfully with pagination",
        data,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalDeposits: total,
        },
      });
    }

    // If no pagination, return all deposits
    const data = await DepositModel.find(query).populate("userId");
    return res.json({ msg: "All deposits retrieved", data });
  } catch (error) {
    console.error("Error in retrieving deposits:", error);
    res
      .status(500)
      .json({ msg: "Failed to retrieve deposits", error: error.message });
  }
};

// Get deposit by id -------------

const getDepositDataByIdController = async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a route parameter

  try {
    const data = await DepositModel.find({ userId }).populate("userId");

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: "No deposits found for this user", data });
    }
    res.json({ msg: "User's deposit data retrieved successfully", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve deposits", error: error.message });
  }
};

// update deposit data -------------

const updateDepositDataController = async (req, res) => {
  const id = req.body._id;
  const status = req.body.status;

      const email = req.body.email;
      const subjects = req.body.subject;

       const selectedDeposit = req.body.selectedDeposit;

       console.log("status" , status);
  // console.log("id--", id);
  try {
    const updatedDeposit = await DepositModel.findByIdAndUpdate(
      id,
      { status: status },
      {
        new: true,
        runValidators: true,
      }
    );


    const {  html } = getDepositDecisionMail({
  actionType: status, // or "reject"
  selectedDeposit,       // { userData:{firstName,lastName}, mt5Account, amount, accountType }
  comment : "deposit",               // optional string
  timestamp: Date.now(), // optional
});


console.log("subjects --> " , subjects)

 res.json({ msg: "Deposits data updated successfully", updatedDeposit });
await transporter.sendMail({
  from: `"${process.env.WEBSITE_NAME}" ${process.env.NODEMAILER_SENDER_EMAIL}`,
  to: email, // recipient
  subjects,        // SUBJECT_APPROVED or SUBJECT_REJECTED based on the action
  html,
});



   
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Failed to update deposit", error: error.message });
  }
};

module.exports = {
  nowPaymentsCallbackController,
  paymentcallbackController,
  addDepositController,
  getDepositDataController,
  getDepositDataByIdController,
  updateDepositDataController,
  createPaymentController,
};
