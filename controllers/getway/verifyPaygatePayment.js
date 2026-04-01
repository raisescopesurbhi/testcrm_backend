const axios = require("axios");
const DepositModel = require("../../models/user/DepositModel");
const nodemailer = require("nodemailer");
const CFgenerateRandomNumber = require("../../utils/randomNumber.js");
const UserModel = require("../../models/user/userModel");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_SMTP,
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: `${process.env.NODEMAILER_EMAIL}`,
    pass: `${process.env.NODEMAILER_PASSWORD}`,
  },
});

const performAction = async (deposit, method) => {
  try {
    const randomNumber = CFgenerateRandomNumber();

    // Call MT5 API to add user
    const addUserApi = await axios.post(
      `${process.env.META_API_END_POINT}/Adduser`,
      {
        Manager_Index: process.env.MANAGER_INDEX,
        MT5Account: randomNumber,
        Name: deposit?.userId?.firstName + deposit.userId?.lastName,
        Country: deposit.userId?.country,
        Leverage: 100,
        Group_Name: deposit.groupName,
      }
    );

    // Check if user was successfully added
    if (!addUserApi.data || addUserApi.data.MT5Account <= 0) {
      throw new Error("Failed to create MT5 account");
    }

    // Make deposit to MT5 account
    await axios.get(
      `${process.env.META_API_END_POINT}/MakeDepositBalance?Manager_Index=${process.env.MANAGER_INDEX}&MT5Account=${randomNumber}&Amount=${deposit.balance}&Comment=DeposiT`
    );

    // Update challenge in DB
    await challengesModel.findByIdAndUpdate(
      deposit.challengeId,
      {
        mt5Account: randomNumber,
        status: "active",
        balance: deposit.balance,
      },
      { new: true }
    );

    // Update user details
    await UserModel.findByIdAndUpdate(
      deposit?.userId?._id,
      {
        accountSize: deposit.balance,
        depositBalance: deposit.deposit,
        phase: 1,
        masterPassword: addUserApi.data.Master_Pwd,
        investorPassword: addUserApi.data.Investor_Pwd,
        mt5Account: randomNumber,
        accountType: deposit.accountType,
        leverage: deposit.leverage,
        lastEquity: deposit.balance,
      },
      { new: true }
    );

    // Add referral commission if applicable
    if (deposit?.userId?.referralFromUserId && deposit?.userId?.referalFromId) {
      try {
        const addCommisonMt5Api = await axios.get(
          `${process.env.META_API_END_POINT}/MakeDepositBalance?Manager_Index=${
            process.env.MANAGER_INDEX
          }&MT5Account=${deposit.userId.referalFromId}&Amount=${(
            Number(deposit.deposit) *
            (Number(process.env.IB_COMMISSION) / 100)
          ).toFixed(2)}&Comment=CRM-ib-deposit`
        );

        await commissionModel.create({
          mt5Account: randomNumber,
          referralId: deposit?.userId?.referalFromId,
          depositBalance: deposit.deposit,
          accountSize: deposit.balance,
          commission:
            Number(deposit.deposit) * (Number(process.env.IB_COMMISSION) / 100),
          accountType: deposit.accountType,
          referralFrom: deposit.userId.referralFromUserId,
          currentReferral: deposit.userId._id,
        });
      } catch (error) {
        console.log("Failed to deposit commission", error);
        // Don't throw error here, continue with the process
      }
    }

    // Increment coupon usages if applicable
    if (deposit?.couponCode) {
      try {
        await coupanModel.findOneAndUpdate(
          { code: deposit.couponCode },
          {
            $inc: { timesUsed: 1 },
            $push: {
              usageHistory: {
                userId: deposit.userId,
                depositId: deposit._id,
              },
            },
          },
          { new: true }
        );
      } catch (error) {
        console.log("Failed to increment coupon", error);
        // Don't throw error here, continue with the process
      }
    }

    if (method === "paynow") {
      // mark verified + account allocation
      if (deposit.payment_status === "finished") {
        deposit.accountAllocated = true;
        deposit.accountAllocatedAt = new Date();
        deposit.verifiedAt = new Date();
      }
    } else if (method === "paygate") {
      console.log("Entered in paygate");
      // mark account as allocated
      deposit.payGateResponse.accountAllocated = true;
      deposit.payGateResponse.accountAllocatedAt = new Date();
    }

    await deposit.save();

    // Send confirmation email
    try {
      const mailOptions = {
        from: `"${process.env.WEBSITE_NAME}" ${process.env.NODEMAILER_SENDER_EMAIL}`,
        to: deposit.userId?.email,
        subject: "Challenge Added",
        html: `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Challenge Added - ${process.env.WEBSITE_NAME}</title>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 5px;
                background-color: #ffffff;
              }
              .header {
                background-color: #002B80;
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
                padding: 10px 20px;
              }
              .cta-button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #002B80;
                color: #FFFFFF;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 10px 0;
              }
              .footer {
                background-color: #002B80;
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
              .withdrawal-details {
                background-color: #f8f8f8;
                border-left: 4px solid #002B80;
                padding: 15px;
                margin: 20px 0;
              }
              .withdrawal-details p {
                margin: 5px 0;
              }
              .highlight {
                font-weight: bold;
                color: #0a2342;
              }
              .risk-warning {
                color: #C70039;
                padding: 5px;
                font-size: 12px;
                line-height: 1.4;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Challenge Created</h1>
              </div>
              <div class="content">
                <p>Dear ${
                  deposit?.userId?.firstName + deposit?.userId?.lastName
                },</p>
                <p>We are pleased to inform you that your initial deposit has been successfully credited to your account</p>
                <div class="withdrawal-details">
                  <p>Account No: <span class="highlight">${randomNumber}</span></p>
                  <p>Master Password: <span class="highlight">${
                    addUserApi.data.Master_Pwd
                  }</span></p>
                  <p>Investor Password: <span class="highlight">${
                    addUserApi.data.Investor_Pwd
                  }</span></p>
                  <p>Server Name: <span class="highlight">${
                    process.env.SERVER_NAME
                  }</span></p>
                  <p>Challenge Type: <span class="highlight">${
                    deposit?.accountType
                  }</span></p>
                  <p>Account Size: <span class="highlight">$${
                    deposit?.balance
                  }</span></p>
                  <p>Deposit Balance: <span class="highlight">$${
                    deposit?.deposit
                  }</span></p>
                </div>
                <p>Thank you for choosing us.</p>
                <p>Happy trading!</p>
                <p>Best regards,<br>The ${
                  process.env.WEBSITE_NAME || "Forex Funding"
                } Team</p>
  
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0f8ff; margin: 20px 0; border-radius: 15px;">
                  <tr>
                    <td align="center" style="padding: 20px;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center" width="33%" style="padding: 0 10px;">
                            <a href="https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5&pcampaignid=web_share" style="display: inline-block; text-decoration: none; color: #ffffff; background-color: #2d6a4f; padding: 15px 20px; border-radius: 8px; font-weight: bold; transition: background-color 0.3s;">
                              <img src="https://cdn-icons-png.flaticon.com/512/14/14415.png" alt="Android" width="24" height="24" style="vertical-align: middle; margin-right: 10px;">
                              <span style="vertical-align: middle;">Android</span>
                            </a>
                          </td>
                          <td align="center" width="33%" style="padding: 0 10px;">
                            <a href="https://apps.apple.com/us/app/metatrader-5/id413251709?platform=ipad" style="display: inline-block; text-decoration: none; color: #ffffff; background-color: #2d6a4f; padding: 15px 20px; border-radius: 8px; font-weight: bold; transition: background-color 0.3s;">
                              <img src="https://cdn3.iconfinder.com/data/icons/social-media-logos-glyph/2048/5315_-_Apple-512.png" alt="iOS" width="24" height="24" style="vertical-align: middle; margin-right: 10px;">
                              <span style="vertical-align: middle;">iOS</span>
                            </a>
                          </td>
                          <td align="center" width="33%" style="padding: 0 10px;">
                            <a href="https://download.mql5.com/cdn/web/metaquotes.ltd/mt5/mt5setup.exe?utm_source=www.metatrader5.com&utm_campaign=download" style="display: inline-block; text-decoration: none; color: #ffffff; background-color: #2d6a4f; padding: 15px 20px; border-radius: 8px; font-weight: bold; transition: background-color 0.3s;">
                              <img src="https://cdn-icons-png.flaticon.com/512/71/71753.png" alt="Windows" width="24" height="24" style="vertical-align: middle; margin-right: 10px;">
                              <span style="vertical-align: middle;">Windows</span>
                            </a>
                          </td>
                        </tr>
                      </table>
                      <hr>
                      <div class="risk-warning">
                        <strong>Risk Warning:</strong> Trading CFDs carries high risk and may result in losses beyond your initial investment. Trade only with money you can afford to lose and understand the risks.  
                        <br><br>
                        Our services are not for U.S. Users or in jurisdictions where they violate local laws.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              <div class="footer">
                <div class="footer-info">    
                  <p>Website: <a href="https://${process.env.EMAIL_WEBSITE}">${
          process.env.EMAIL_WEBSITE
        }</a> | E-mail: <a href="mailto:${
          process.env.EMAIL_EMAIL || "forextest@mail.com"
        }">${process.env.EMAIL_EMAIL || "forextest@mail.com"}</a></p>
                  <p>We sent out this message to all existing ${
                    process.env.EMAIL_WEBSITE || "Forex Funding"
                  } traders. Please visit this page to know more about our Privacy Policy.</p>
                  <p>&copy; 2025 ${
                    process.env.EMAIL_WEBSITE || "Forex Funding"
                  }. All Rights Reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>`,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.log("Failed to send mail", error);
    }

    console.log(
      `Account successfully allocated for 💚 💚 💚 ${deposit?.userId?.email}`
    );
    return true;
  } catch (error) {
    console.log(
      "Failed to allocate account",
      error?.response?.data?.message || error?.response || error
    );
    // console.log(
    //   "Failed URL:",   error
    // );
    // Very important: Re-throw the error so the retry logic catches it
    throw error;
  }
};

/**
 * Retries an operation multiple times until it succeeds or reaches max retries
 * @param {Function} operation - The async operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} [delay=1000] - Delay between retries in milliseconds
 * @param {number} [backoffFactor=1.5] - Factor to increase delay on each retry
 * @returns {Promise<{success: boolean, retryCount: number, error?: Error}>}
 */

// deposit_payNowResponse.payNowResponse.receivedAmount =
//   deposit_payNowResponse.payNowResponse.amount;

// await deposit_payNowResponse.save();

//   deposit_payNowResponse &&
// deposit_payNowResponse.status === "finished"

const handleDepositePaynowResponse = async (deposit_payNowResponse) => {
  const response = await axios.get(
    `https://api.nowpayments.io/v1/payment/${deposit_payNowResponse.payNowResponse.orderId}`,
    {
      headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY },
    }
  );

  if (response.data.payment_status === "finished") {
    // update your DB
    await DepositModel.findOneAndUpdate(
      { orderId },
      { status: "completed", paymentId: response.data.payment_id }
    );
    return res.json({ success: true, data: response.data });
  }

  res.json({ success: false, data: response.data });
};

const retryOperation = async (
  operation,
  maxRetries,
  delay = 1000,
  backoffFactor = 1.5
) => {
  let retryCount = 0;
  let currentDelay = delay;

  while (retryCount < maxRetries) {
    try {
      await operation();
      return {
        success: true,
        retryCount,
      };
    } catch (error) {
      retryCount++;
      console.log(
        `Operation failed, retry attempt ${retryCount}/${maxRetries}`
      );
      console.error("Error:", error.message);

      if (retryCount >= maxRetries) {
        return {
          success: false,
          retryCount,
          error,
        };
      }

      // Wait before next retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay = Math.floor(currentDelay * backoffFactor);
    }
  }
};

const verifyPaymentController = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing orderId" });
    }

    // ********************************** payNow verification *****************************

    const deposit_payNowResponse = await DepositModel.findOne({
      "payNowResponse.orderId": orderId,
    }).populate("userId");

    if (deposit_payNowResponse) {
      const response = await handleDepositePaynowResponse(
        deposit_payNowResponse
      );

      return res
        .status(200)
        .json({ success: true, message: "Payment verified via PayNow" });
    } else if (
      deposit_payNowResponse &&
      deposit_payNowResponse.status !== "finished"
    ) {
      return res
        .status(402)
        .json({ success: false, message: "Payment not completed yet" });
    }

    // ************ end *****************

    const deposit = await DepositModel.findOne({
      "payGateResponse.orderId": orderId,
    }).populate("userId");

    if (!deposit) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (deposit.payGateResponse.accountAllocated) {
      return res.status(404).json({
        success: true,
        message:
          "Duplicate request. Account has already been allocated for this payment.",
      });
    }

    const ipnToken = deposit.payGateResponse?.payGateResponse?.ipn_token;
    if (!ipnToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing IPN token" });
    }

    // // 🟡 Call PayGate status API
    const statusRes = await axios.get(
      "https://api.paygate.to/control/payment-status.php",
      {
        params: { ipn_token: ipnToken },
      }
    );

    const { status, value_coin, txid_out, coin } = statusRes.data;

    if (status === "paid") {
      deposit.status = "paid";
      deposit.payGateResponse.receivedAmount = parseFloat(value_coin);
      deposit.payGateResponse.verifiedAt = new Date();
      deposit.payGateResponse.txid_out = txid_out;
      deposit.payGateResponse.payoutCoin = coin;
      await deposit.save();
      // Send success response immediately
      res.json({
        success: true,
        message: "Payment verified via PayGate",
        // value: value_coin,
      });

      // Trigger async logic in background (no await)
      retryOperation(() => performAction(deposit, "paygate"), maxRetries).catch(
        (err) => {
          console.error("Async task failed after response:", err);
        }
      );

      return; // end function
    } else {
      return res
        .status(402)
        .json({ success: false, message: "Payment not completed yet" });
    }
  } catch (err) {
    console.error("PayGate verify error:", err?.response?.data || err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// const nowPaymentsCallbackController = async (req, res) => {
//   try {
//     const {
//       order_id,
//       payment_id,
//       payment_status, // "waiting", "confirmed", "finished", "failed"
//     } = req.body;

//     console.log("NOWPayments IPN received:", req.body);

//     const depositData = await DepositModel.findOne({
//       "payNowResponse.orderId": order_id?.toString(),
//     }).populate("userId");

//     if (!depositData) {
//       console.error("Deposit record not found:", payment_id || order_id);
//       return res.status(404).json({ error: "Deposit record not found" });
//     }

//     // Only update if status has changed
//     if (depositData.status !== payment_status) {
//       depositData.status = payment_status;
//       depositData.payNowResponse.payNowResponse.payment_id = payment_id;
//       await depositData.save();
//       console.log("Deposit record updated:", depositData);

//       // Emit real-time update to room (payment_id)
//       const io = req.app.get("io");
//       io.to(order_id).emit("paymentUpdate", {
//         order_id: order_id,
//       });

//       console.log(
//         `Payment status updated to ${payment_status} for order ${order_id} typed ${typeof payment_status}`
//       );

//       if (payment_status == "finished") {
//         console.log(
//           "Triggering async account allocation for NOWPayments",
//           depositData
//         );

//         retryOperation(
//           () => performAction(depositData, "paynow"),
//           maxRetries
//         ).catch((err) => {
//           console.error("Async task failed after response:", err);
//         });

//         // user/verify-payment/?orderId=order_id
//       }
//     } else {
//       console.log("Payment status unchanged, skipping update.");
//     }

//     // ✅ Correct response for NOWPayments
//     res.sendStatus(200);
//   } catch (error) {
//     console.error("Error in NOWPayments callback:", error);
//     res.status(500).json({ error: "Server error in callback" });
//   }
// };

const nowPaymentsCallbackController = async (req, res) => {
  try {
    const {
      order_id,
      payment_id,
      payment_status, // "waiting", "confirmed", "finished", "failed"
      price_amount,
      price_currency,
      pay_currency,
      actually_paid_amount,
      customer_email,
      customer_name,
    } = req.body;

    console.log("NOWPayments IPN received:", req.body);

    // Find deposit/order by orderId
    const depositData = await DepositModel.findOne({
      "payNowResponse.orderId": order_id?.toString(),
    }).populate("userId");

    if (!depositData) {
      console.error("Deposit record not found:", payment_id || order_id);
      return res.status(404).json({ error: "Deposit record not found" });
    }

    // Only update if status has changed
    if (depositData.status !== payment_status) {
      // Update status
      depositData.status = payment_status;

      // Store payment_id
      depositData.payNowResponse.payment_id = payment_id;

      // Store amount actually received
      depositData.receivedAmount =
        actually_paid_amount || price_amount || depositData.amount;

      // Optional: store currency actually paid in
      depositData.payNowResponse.pay_currency =
        pay_currency || depositData.currency;

      // Mark verified if payment finished
      if (payment_status === "finished") {
        depositData.accountAllocated = true;
        depositData.accountAllocatedAt = new Date();
        depositData.verifiedAt = new Date();
      }

      await depositData.save();
      console.log("Deposit record updated:", depositData);

      // Emit real-time update via socket
      const io = req.app.get("io");
      io.to(order_id).emit("paymentUpdate", { order_id });

      // Trigger async account allocation if finished
      if (payment_status === "finished") {
        console.log(
          "Triggering async account allocation for NOWPayments",
          depositData
        );

        retryOperation(
          () => performAction(depositData, "paynow"),
          maxRetries
        ).catch((err) => {
          console.error("Async task failed after response:", err);
        });
      }
    } else {
      console.log("Payment status unchanged, skipping update.");
    }

    // ✅ Correct response for NOWPayments
    res.sendStatus(200);
  } catch (error) {
    console.error("Error in NOWPayments callback:", error);
    res.status(500).json({ error: "Server error in callback" });
  }
};
const swftxPaymentCallbackController = async (req, res) => {
  try {
    const body = req.body;
    console.log("SWFTX IPN received:", body);
  } catch (error) {
    console.error("Error in SWFTX callback:", error);
    res.status(500).json({ error: "Server error in callback" });
  }
};

// ******************* Changed *******************

const NOW_BASE = "https://api.nowpayments.io/v1";

const npHeaders = {
  "x-api-key": process.env.NOWPAYMENTS_API_KEY,
  "Content-Type": "application/json",
};

const EPS = 1e-8;

async function getPaymentIdForDeposit(deposit) {
  // 1) From latest status snapshot
  const snap = deposit?.payNowResponse?.paynowStatusChangedResponse;
  if (snap?.payment_id) return snap.payment_id;

  // 2) From history (last with a payment_id)
  const hist = deposit?.payNowResponse?.paynowStatusHistory || [];
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i]?.payment_id) return hist[i].payment_id;
  }

  // 3) Fallback: pull by invoice id => get payments, pick the latest
  const invoiceId = deposit?.payNowResponse?.paynowCreateInvoiceResponse?.id;
  if (!invoiceId) return null;

  try {
    const { data: inv } = await axios.get(`${NOW_BASE}/invoice/${invoiceId}`, {
      headers: npHeaders,
      timeout: 20000,
    });
    // Some NOW endpoints return a `payments` array on the invoice
    const payments = inv?.payments || inv?.payment_list || [];
    if (Array.isArray(payments) && payments.length) {
      // pick the last/most recent with a payment_id
      const last = [...payments].reverse().find((p) => p?.payment_id);
      return last?.payment_id || null;
    }
  } catch (_) {
    // ignore; we'll just return null and tell caller no payment yet
  }
  return null;
}

// --- helpers ---------------------------------------------------------------

// run allocation exactly-once (uses a lightweight lock in DB)
const maxRetries = 3;

async function maybeAllocatePaynow(depositDoc, amountMismatch) {
  try {
    // 1) must be finished & no mismatch
    const nowStatus = depositDoc.nowLastStatus || depositDoc.status;

    if (nowStatus !== "finished") return;
    if (amountMismatch) return;

    // 2) already allocated? bail
    if (depositDoc.accountAllocated === true) return;

    // 3) try to acquire a lock atomically (prevents double allocation)
    const locked = await DepositModel.findOneAndUpdate(
      {
        _id: depositDoc._id,
        accountAllocated: { $ne: true },
        "meta.allocationLock": { $ne: true },
      },
      {
        $set: {
          "meta.allocationLock": true,
          "meta.allocationLockedAt": new Date(),
        },
      },
      { new: true, strict: false }
    );
    if (!locked) return; // someone else is handling or already allocated

    // 4) double-check still finished after lock acquired
    const fresh = await DepositModel.findById(locked._id).populate("userId");
    const freshStatus = fresh.nowLastStatus || fresh.status;

    if (freshStatus !== "finished") {
      await DepositModel.updateOne(
        { _id: locked._id },
        {
          $set: { "meta.alcNote": "status changed after lock" },
          $unset: { "meta.allocationLock": "" },
        },
        { strict: false }
      );
      return;
    }

    // 5) do allocation (idempotent); DO NOT throw up to API response
    const result = await retryOperation(
      () => performAction(fresh, "paynow"),
      maxRetries,
      1000,
      1.5
    );

    if (result?.success) {
      // mark allocated (even if performAction already set some fields)
      await DepositModel.updateOne(
        { _id: fresh._id },
        {
          $set: {
            accountAllocated: true,
            accountAllocatedAt: new Date(),
            verifiedAt: new Date(),
            "meta.allocationResult": "success",
            "meta.lastAllocatedAt": new Date(),
          },
          $unset: { "meta.allocationLock": "" },
        },
        { strict: false }
      );
    } else {
      await DepositModel.updateOne(
        { _id: fresh._id },
        {
          $set: {
            "meta.allocationResult": "failed",
            "meta.allocationError": String(
              result?.error?.message || result?.error || "unknown"
            ),
          },
          $unset: { "meta.allocationLock": "" },
        },
        { strict: false }
      );
    }
  } catch (e) {
    // best effort: clear the lock so a later call/IPN can retry
    await DepositModel.updateOne(
      { _id: depositDoc._id },
      {
        $set: {
          "meta.allocationResult": "failed",
          "meta.allocationError": String(e?.message || e),
        },
        $unset: { "meta.allocationLock": "" },
      },
      { strict: false }
    );
  }
}

const checkNowPaymentStatus = async (req, res) => {
  console.log(
    "Entered CheckNOWPAYMENT STATUS**********************************"
  );

  try {
    const depositId = req.params.depositId || req.query.depositId;

    if (!depositId) {
      return res
        .status(400)
        .json({ success: false, message: "depositId is required" });
    }
    if (!process.env.NOWPAYMENTS_API_KEY) {
      return res
        .status(500)
        .json({ success: false, message: "NOWPayments API key missing" });
    }

    // 🔹 1) Load deposit
    const deposit = await DepositModel.findById(depositId).populate("userId");

    if (!deposit) {
      return res
        .status(404)
        .json({ success: false, message: "Deposit not found" });
    }

    // 🔹 2) Resolve payment_id (from status/history or by invoice lookup)
    let paymentId = req.query.payment_id;
    if (!paymentId) {
      paymentId = await getPaymentIdForDeposit(deposit);
    }
    if (!paymentId) {
      return res.status(409).json({
        success: false,
        message:
          "No payment_id yet for this deposit (invoice created but no payment started).",
      });
    }

    // 🔹 3) Fetch payment from NOWPayments
    const { data: paymentData } = await axios.get(
      `${NOW_BASE}/payment/${paymentId}`,
      {
        headers: npHeaders,
        timeout: 20000,
      }
    );

    console.log("Status comming....", paymentData?.payment_status);

    // Normalize numerics for comparisons
    const price_amount =
      paymentData?.price_amount != null
        ? Number(paymentData.price_amount)
        : undefined;
    const pay_amount =
      paymentData?.pay_amount != null
        ? Number(paymentData.pay_amount)
        : undefined;
    const actually_paid =
      paymentData?.actually_paid != null
        ? Number(paymentData.actually_paid)
        : undefined;

    // Build compact status object to store
    const statusObj = {
      eventReceivedAt: new Date(),
      payment_id: paymentData.payment_id,
      invoice_id: paymentData.invoice_id,
      payment_status: paymentData.payment_status,
      order_id: paymentData.order_id,
      order_description: paymentData.order_description,
      price_amount,
      price_currency: paymentData.price_currency,
      pay_amount,
      pay_currency: paymentData.pay_currency,
      amount_received:
        paymentData.amount_received != null
          ? Number(paymentData.amount_received)
          : undefined,
      actually_paid,
      pay_address: paymentData.pay_address,
      purchase_id: paymentData.purchase_id,
      transaction_id: paymentData.transaction_id,
      network: paymentData.network,
      ipn_type: paymentData.ipn_type,
      raw: paymentData,
    };

    // 🔹 4) Detect change
    const prevStatus = deposit.nowLastStatus || deposit.status;
    const statusChanged = prevStatus !== paymentData.payment_status;

    // 🔹 5) Optional amount check (warn on mismatch)
    // Compare expected pay_amount vs actually_paid if both present
    let amountMismatch = false;
    if (typeof pay_amount === "number" && typeof actually_paid === "number") {
      amountMismatch = Math.abs(pay_amount - actually_paid) > EPS;
    }

    // 🔹 6) Build atomic update
    const update = {
      $set: {
        status: paymentData.payment_status, // keep top-level in sync
        nowLastStatus: paymentData.payment_status,
        "payNowResponse.paynowStatusChangedResponse": statusObj,
      },
      $push: {
        "payNowResponse.paynowStatusHistory": statusObj,
      },
      $inc: {
        // keep a simple counter of checks; path not in schema → allow via strict:false
        "meta.statusCheckCount": 1,
      },
    };

    // convenience mirrors
    if (paymentData.order_id) update.$set.nowOrderId = paymentData.order_id;
    if (paymentData.pay_currency != null)
      update.$set.nowPayCurrency = paymentData.pay_currency;

    // 🔹 7) Apply update
    const updated = await DepositModel.findByIdAndUpdate(depositId, update, {
      new: true,
      upsert: false,
      strict: false, // allow $inc on a non-schema path like meta.statusCheckCount
    }).populate("userId");

    // 🔹 8) Emit socket event if changed
    if (statusChanged) {
      const io = req.app.get("io");
      if (io) {
        io.to(paymentData.order_id || deposit.orderId).emit("paymentUpdate", {
          order_id: paymentData.order_id,
          payment_status: paymentData.payment_status,
        });
      }
    }

    // 🔹 9) If finished, trigger allocation (fire-and-forget)
    if (paymentData.payment_status === "finished") {
      // don't block the response
      maybeAllocatePaynow(updated, amountMismatch).catch(() => {});
    }

    // 🔹 10) Handle amount mismatch (non-fatal response)
    if (amountMismatch) {
      return res.json({
        success: false,
        message: `Payment amount mismatch: expected ${pay_amount}, received ${actually_paid}.`,
        expected: pay_amount,
        received: actually_paid,
        payment: {
          payment_id: paymentData.payment_id,
          order_id: paymentData.order_id,
          price_amount,
          price_currency: paymentData.price_currency,
          pay_amount,
          pay_currency: paymentData.pay_currency,
          payment_status: paymentData.payment_status,
          actually_paid,
          created_at: paymentData.created_at,
        },
        dbRecord: updated,
      });
    }

    // 🔹 11) Respond OK
    return res.json({
      success: true,
      payment: {
        payment_id: paymentData.payment_id,
        order_id: paymentData.order_id,
        price_amount,
        price_currency: paymentData.price_currency,
        pay_amount,
        pay_currency: paymentData.pay_currency,
        payment_status: paymentData.payment_status,
        actually_paid,
        created_at: paymentData.created_at,
      },
      dbRecord: updated,
    });
  } catch (error) {
    console.error(
      "Error checking payment status:",
      error?.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment status",
      details: error?.response?.data || error.message,
    });
  }
};

function sortObject(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  return Object.keys(obj)
    .sort()
    .reduce((acc, k) => {
      acc[k] = sortObject(obj[k]);
      return acc;
    }, {});
}

/** Timing-safe hex compare */
function tsecHex(a, b) {
  try {
    const A = Buffer.from(String(a).trim().toLowerCase(), "hex");
    const B = Buffer.from(String(b).trim().toLowerCase(), "hex");
    if (A.length !== B.length) return false;
    return crypto.timingSafeEqual(A, B);
  } catch {
    return false;
  }
}

/** Normalize number fields (undefined if empty) */
const toNum = (v) =>
  v === null || v === undefined || v === "" ? undefined : Number(v);

async function nowpaymentsIpnStoreOnly(req, res) {
  console.log(
    "Entered NowPayment IPN STORE SUCCESSFULLY!!!! ***********************"
  );

  try {
    const secret = process.env.NP_IPN_SECRET || "";
    if (!secret) {
      console.error("NOWPayments IPN: NP_IPN_SECRET missing");
      return res.sendStatus(200); // ACK to avoid retries
    }

    // --- Verify signature ---
    const sigHeader = (
      req.get("x-nowpayments-sig") ||
      req.headers["x-nowpayments-sig"] ||
      ""
    )
      .toString()
      .trim();

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const sorted = sortObject(body);
    const bodyStr = JSON.stringify(sorted);

    const expectedSig = crypto
      .createHmac("sha512", secret)
      .update(bodyStr)
      .digest("hex");

    if (!tsecHex(sigHeader, expectedSig)) {
      console.warn("NOWPayments IPN: invalid signature");
      return res.status(400).send("Invalid signature");
    }

    // --- Normalize status object ---
    const p = body;
    const statusObj = {
      eventReceivedAt: new Date(),
      payment_id: p.payment_id ? String(p.payment_id) : undefined,
      invoice_id: p.invoice_id ? String(p.invoice_id) : undefined,
      payment_status: p.payment_status,
      order_id: p.order_id ? String(p.order_id) : undefined,
      order_description: p.order_description,

      price_amount: toNum(p.price_amount),
      price_currency: p.price_currency,
      pay_amount: toNum(p.pay_amount),
      pay_currency: p.pay_currency,

      amount_received: toNum(p.amount_received),
      actually_paid: toNum(p.actually_paid),

      pay_address: p.pay_address,
      purchase_id: p.purchase_id ? String(p.purchase_id) : undefined,
      transaction_id: p.transaction_id,
      network: p.network,
      ipn_type: p.ipn_type,

      raw: p,
    };

    console.log("NOWPayments payload:", statusObj);

    // --- Find deposit (prefer your own order_id) ---
    let match = {};

    if (statusObj.order_id) {
      // BEST: your own order_id
      match = { orderId: statusObj.order_id };
    } else if (statusObj.invoice_id) {
      // fallback: invoice_id from NOWPayments
      match = { nowInvoiceId: statusObj.invoice_id };
    } else {
      // last resort: match by amount+currency (avoid dupes)
      match = {
        price_amount: statusObj.price_amount,
        price_currency: statusObj.price_currency,
        status: { $ne: "finished" },
      };
    }

    console.log("Match" , match);
    

    const deposit = await DepositModel.findOne(match).lean();
    console.log("Matched deposit:", deposit);

    if (!deposit) {
      console.error("NOWPayments IPN: deposit not found for", {
        invoice_id: statusObj.invoice_id,
        order_id: statusObj.order_id,
        payment_id: statusObj.payment_id,
      });
      return res.sendStatus(200); // still ACK
    }

    // --- Compare statuses ---
    const currentStatus =
      deposit.status ||
      deposit?.payNowResponse?.paynowStatusChangedResponse?.payment_status ||
      "unknown";

    const incomingStatus = statusObj.payment_status || "unknown";
    const statusChanged = currentStatus !== incomingStatus;

    // --- Build update ---
    const update = {
      $push: { "payNowResponse.paynowStatusHistory": statusObj },
      $inc: { "meta.ipnCount": 1 },
    };

    if (statusChanged) {
      update.$set = {
        ...(update.$set || {}),
        status: incomingStatus,
        nowLastStatus: incomingStatus,
        nowPaymentId: statusObj.payment_id ?? null,
        "payNowResponse.paynowStatusChangedResponse": statusObj,
      };
      if (statusObj.invoice_id) update.$set.nowInvoiceId = statusObj.invoice_id;
      if (statusObj.order_id) update.$set.nowOrderId = statusObj.order_id;
      if (p.pay_currency != null) update.$set.nowPayCurrency = p.pay_currency;
    }

    await DepositModel.updateOne({ _id: deposit._id }, update, {
      strict: false, // allow creating missing keys
    });


    return res.sendStatus(200);
  } catch (err) {
    console.error(
      "NOWPayments IPN store-only error:",
      err?.response?.data || err.message
    );
    return res.sendStatus(200); // ACK anyway
  }
}

module.exports = {
  nowpaymentsIpnStoreOnly,
  verifyPaymentController,
  nowPaymentsCallbackController,
  checkNowPaymentStatus,
  swftxPaymentCallbackController,
};
