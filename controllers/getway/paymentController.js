const axios = require("axios");
const DepositModel = require("../../models/user/DepositModel");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid"); // Or your generateOrderId function
const multer = require("multer");
const path = require("path");

// ********************* new  *************************

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

const NOW_BASE = "https://api.nowpayments.io/v1";
const isHttpUrl = (u) => !!u && /^https?:\/\//i.test(u);

const FRONTEND_BASE = process.env.FRONTEND_URL;

const createPayNowPayment = async (req, res) => {
  upload.single("depositSS")(req, res, async function (err) {
    const orderId = uuidv4();

    // -------- Extract --------
    const Body = req.body;

    console.log("Bodyyyy", Body);

    //  return;

    const amount = Body.deposit;
    let currency = "USD";

    // -------- Validate --------
    if (amount == null) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount",
      });
    }
    const priceAmount = Number(amount);
    if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be a positive number" });
    }

    currency = String(currency).trim().toUpperCase();

    if (!process.env.NOWPAYMENTS_API_KEY) {
      return res
        .status(500)
        .json({ success: false, message: "NOWPayments API key missing" });
    }
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
    });

    const depositId = newSaved._id;

    const successUrl = `${FRONTEND_BASE}/user/payments/now/success/${encodeURIComponent(
      depositId
    )}?oid=${encodeURIComponent(orderId)}`;
    const cancelUrl = `${FRONTEND_BASE}/user/payments/now/cancel/${encodeURIComponent(
      depositId
    )}?oid=${encodeURIComponent(orderId)}`;

    // (safety: ensure they’re absolute)
    if (!isHttpUrl(successUrl) || !isHttpUrl(cancelUrl)) {
      return res.status(500).json({
        success: false,
        message: "Return URLs must be absolute http(s) URLs",
      });
    }

    console.log(successUrl);
    console.log(cancelUrl);

    // if below 12$ fee paid by merchant .. fixed rate false...
    // else above 12$ fee paid by customer.. fixed rate true...

    let payByUser = false;
    let fixedRate = false;
    

    // if(amount >= 12){

    //   payByUser = true;
    //   fixedRate = true;

    // }

    // console.log("Pay By User" , payByUser);
    // console.log("Fixed Rate" , fixedRate);



    try {
      // Optional: check deposit exists (non-blocking)
      await DepositModel.findById(depositId)
        .lean()
        .catch(() => null);

      // -------- Create NOW INVOICE (hosted checkout) --------
      const payload = {
        price_amount: 5,
        price_currency: currency,
        order_id: orderId,
        order_description: `Deposit ${depositId}`,
        is_fixed_rate: fixedRate, // ~20 min lock
        is_fee_paid_by_user: payByUser, // ALWAYS fees paid by user
        ipn_callback_url: `${process.env.BACKEND_URL}/api/auth/webhooks/nowpayments`,
        success_url: successUrl, // << hardcoded with depositId
        cancel_url: cancelUrl, // << hardcoded with depositId
      };

      console.log(payload);

      const { data: inv } = await axios.post(`${NOW_BASE}/invoice`, payload, {
        headers: {
          "x-api-key": process.env.NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": `inv-${orderId}`,
        },
        timeout: 25000,
      });

      // Normalize for storage
      const normalizedInvoice = {
        ...inv,
        orderId,
        currency,
        price_amount: Number(inv.price_amount),

        // mirrors
        nowInvoiceId: inv.id,
        nowInvoiceUrl: inv.invoice_url,
        nowOrderId: inv.order_id,
        nowPriceAmount: Number(inv.price_amount),
        nowPriceCurrency: inv.price_currency,
        nowPayCurrency: inv.pay_currency,
        nowIsFixedRate: !!inv.is_fixed_rate,
        nowIsFeePaidByUser: !!inv.is_fee_paid_by_user,
        nowLastStatus: "invoice_created",

        invoiceCreatedAt: inv.created_at,

        created_at: inv.created_at ? new Date(inv.created_at) : undefined,
        updated_at: inv.updated_at ? new Date(inv.updated_at) : undefined,
      };

      // -------- Persist (schema-aligned) --------
      const update = {
        $set: {
                  orderId,
          deposit: String(priceAmount),
          status: "invoice_created",
          "payNowResponse.paynowCreateInvoiceResponse": normalizedInvoice,
        },
      };

      await DepositModel.findByIdAndUpdate(depositId, update, {
        new: true,
        upsert: true,
      });

      // -------- Build response for frontend --------
      const invoiceForFrontend = {
        id: inv.id,
        token_id: inv.token_id,
        order_id: inv.order_id,
        price_amount: Number(inv.price_amount),
        price_currency: inv.price_currency,
        pay_currency: inv.pay_currency || null,
        invoice_url: inv.invoice_url,
        success_url: inv.success_url || successUrl, // should echo back what we sent
        cancel_url: inv.cancel_url || cancelUrl, // should echo back what we sent
        is_fixed_rate: !!inv.is_fixed_rate,
        is_fee_paid_by_user: !!inv.is_fee_paid_by_user,
        created_at: inv.created_at,
        updated_at: inv.updated_at,
      };

      return res.status(201).json({
        success: true,
        invoice: invoiceForFrontend,
        policy: {
          is_hosted_checkout: true,
          is_fixed_rate: !!fixedRate,
          is_fee_paid_by_user: !!payByUser,
        },
      });
    } catch (error) {
      const npErr = error?.response?.data;
      console.error("NOWPayments /v1/invoice error:", npErr || error.message);
      return res.status(error?.response?.status || 500).json({
        success: false,
        message: "Failed to create invoice",
        details: npErr || { message: error.message },
      });
    }
  });
};

module.exports = {
  createPayNowPayment,
};
