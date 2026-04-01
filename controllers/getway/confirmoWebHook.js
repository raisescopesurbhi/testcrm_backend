const challengesModel = require("../../models/user/ChallengesModel.js");
const commissionModel = require("../../models/user/CommissionModel");
const coupanModel = require("../../models/user/coupanModel");
const UserModel = require("../../models/user/userModel");
const axios = require("axios");
const DepositModel = require("../../models/user/DepositModel");
const CFgenerateRandomNumber = require("../../utils/randomNumber");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_SMTP,
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: `${process.env.NODEMAILER_EMAIL}`,
    pass: `${process.env.NODEMAILER_PASSWORD}`,
  },
});

const performAction = async (data, deposit, confirmoInvoiceId, status) => {
  try {
    const randomNumber = CFgenerateRandomNumber();

    // Update deposit status to processing first
    await DepositModel.findOneAndUpdate(
      { confirmoInvoiceId },
      {
        status: "processing",
        confirmoResponse: data,
      },
      { new: true }
    );

    // Call MT5 API to add user
    const addUserApi = await axios.post(
      `${process.env.META_API_END_POINT}/Adduser`,
      {
        Manager_Index:  process.env.MANAGER_INDEX,
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
    const depositApires = await axios.get(
      `${process.env.META_API_END_POINT}/MakeDepositBalance?Manager_Index=${
        process.env.MANAGER_INDEX
      }&MT5Account=${randomNumber}&Amount=${
        deposit.balance
      }&Comment=CRM-deposit`
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
          { $inc: { timesUsed: 1 } },
          { new: true }
        );
      } catch (error) {
        console.log("Failed to increment coupon", error);
        // Don't throw error here, continue with the process
      }
    }

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
              <p>Dear ${deposit?.userId?.firstName + deposit?.userId?.lastName},</p>
              <p>We are pleased to inform you that your initial deposit has been successfully credited to your account</p>
              <div class="withdrawal-details">
                <p>Account No: <span class="highlight">${randomNumber}</span></p>
                <p>Master Password: <span class="highlight">${addUserApi.data.Master_Pwd}</span></p>
                <p>Investor Password: <span class="highlight">${addUserApi.data.Investor_Pwd}</span></p>
                <p>Server Name: <span class="highlight">${process.env.SERVER_NAME}</span></p>
                <p>Challenge Type: <span class="highlight">${deposit?.accountType}</span></p>
                <p>Account Size: <span class="highlight">$${deposit?.balance}</span></p>
                <p>Deposit Balance: <span class="highlight">$${deposit?.deposit}</span></p>
              </div>
              <p>Thank you for choosing us.</p>
              <p>Happy trading!</p>
              <p>Best regards,<br>The ${process.env.WEBSITE_NAME || "Forex Funding"} Team</p>

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
                <p>Website: <a href="https://${process.env.EMAIL_WEBSITE}">${process.env.EMAIL_WEBSITE}</a> | E-mail: <a href="mailto:${process.env.EMAIL_EMAIL || "forextest@mail.com"}">${process.env.EMAIL_EMAIL || "forextest@mail.com"}</a></p>
                <p>We sent out this message to all existing ${process.env.EMAIL_WEBSITE || "Forex Funding"} traders. Please visit this page to know more about our Privacy Policy.</p>
                <p>&copy; 2025 ${process.env.EMAIL_WEBSITE || "Forex Funding"}. All Rights Reserved</p>
              </div>
            </div>
          </div>
        </body>
        </html>`,
      };
      
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.log("Failed to send mail", error);
      // Don't throw error here, continue with the process
    }

    // Update deposit status to paid after all operations are complete
    await DepositModel.findOneAndUpdate(
      { confirmoInvoiceId },
      {
        status: "paid",
        mt5Account: randomNumber,
        confirmoResponse: data,
      },
      { new: true }
    );

    console.log(`Account successfully allocated for 💚 💚 💚 ${deposit?.userId?.email}`);
    return true;
  } catch (error) {
    console.log(
      "Failed to perform task",
      error?.response?.data?.message || error?.response || error
    );
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
const retryOperation = async (operation, maxRetries, delay = 1000, backoffFactor = 1.5) => {
  let retryCount = 0;
  let currentDelay = delay;
  
  while (retryCount < maxRetries) {
    try {
      await operation();
      return { 
        success: true, 
        retryCount 
      };
    } catch (error) {
      retryCount++;
      console.log(`Operation failed, retry attempt ${retryCount}/${maxRetries}`);
      console.error("Error:", error.message);
      
      if (retryCount >= maxRetries) {
        return { 
          success: false, 
          retryCount, 
          error 
        };
      }
      
      // Wait before next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.floor(currentDelay * backoffFactor);
    }
  }
};

const confirmoWebhook = async (req, res) => {
  try {
    // For testing, use this mock data
    // const data = {
    //   id: 'invgll3v2lmg',
    //   address: 'TSYFypwHb1z8MgJQUBFVuJ9kVzRxp84SvU',
    //   confirmations: 20,
    //   confirmingSince: 1746427184,
    //   createdAt: 1746426963,
    //   customerAmount: { amount: '1.90449', currency: 'TRX' },
    //   cryptoUri: null,
    //   flags: {
    //     refundable: false,
    //     notRefundableCause: 'REFUND_AMOUNT_ZERO',
    //     resolvableStatus: 'NO',
    //     overpaymentResolvable: false
    //   },
    //   merchantAmount: { amount: '0.1', currency: 'USD' },
    //   networkFee: '1.5',
    //   paid: {
    //     amount: '1.90449',
    //     currency: 'TRX',
    //     diff: '0',
    //     amountUnconfirmed: '0'
    //   },
    //   paidSince: 1746427245,
    //   expiredSince: null,
    //   activeSince: 1746427116,
    //   preparedSince: 1746426963,
    //   product: { name: '', description: '' },
    //   rate: {
    //     currencyFrom: 'USD',
    //     currencyTo: 'TRX',
    //     value: '0.247224900491977551979'
    //   },
    //   refunds: [],
    //   requiredConfirmations: 1,
    //   returnUrl: null,
    //   status: 'paid',
    //   timeoutTime: 1746428016,
    //   cryptoTransactions: [
    //     {
    //       txid: 'a7242a25a4ec39a77896361182b5c2054662dcbc2de059f2238e92fb738650e4',
    //       confirmations: 20,
    //       amount: '1.90449',
    //       createdAt: 1746427174,
    //       updatedAt: 1746427245
    //     }
    //   ],
    //   unhandledExceptions: false,
    //   overUnderPaidAmount: '0',
    //   layer2Attributes: null,
    //   takeInfo: null,
    //   cryptoExternalUrl: {
    //     currency: 'TRX',
    //     addressUrl: 'https://tronscan.org/#/address/{0}',
    //     transactionUrl: 'https://tronscan.org/#/transaction/{0}',
    //     name: 'TRONscan'
    //   },
    //   resolvedManually: null,
    //   settlementAmount: { amount: '0.0992', currency: 'USDT' },
    //   notifyEmail: null,
    //   notifyUrl: 'https://af99-192-250-230-125.ngrok-free.app/api/auth/payment/webhook',
    //   errorSince: null,
    //   reference: 'order_1746426962997',
    //   refundLink: null,
    //   requiredConfirmationsToRefund: 1,
    //   url: 'https://confirmo.net/public/invoice/invdqxk57yje?m=mer2eyk880gk',
    //   settlement: null,
    //   emailInvoiceId: null,
    //   buttonInvoiceId: null,
    //   subscriptionId: null,
    //   fee: '0.0008',
    //   resolvedByEmail: null,
    //   closedAt: null,
    //   customerEmail: null,
    //   customerPaymentMethodId: 'TRON-BLOCKCHAIN-MAINNET-TRX-CURRENCY'
    // };
    
    // For production, use the actual request body
    const data = req.body;
    
    // Validate webhook payload
    if (!data || !data.id) {
      return res.status(400).json({ error: "Invalid webhook payload." });
    }

    const confirmoInvoiceId = data.id;
    const status = data.status;
    const expectedAmount = parseFloat(data.customerAmount?.amount);
    const paidAmount = parseFloat(data.paid?.amount);

    console.log("Confirmo Webhook Triggered:", { status, confirmoInvoiceId });

    // Find deposit record in database
    const deposit = await DepositModel.findOne({ confirmoInvoiceId }).populate("userId");
    if (!deposit) {
      console.warn("No deposit found for Confirmo invoice ID:", confirmoInvoiceId);
      return res.status(404).json({ error: "No matching deposit found." });
    }

    // If status is "paid" or "confirmed"
    if (status === "paid" || status === "confirmed") {
      // Validate payment amount
      if (expectedAmount !== paidAmount) {
        await DepositModel.findOneAndUpdate(
          { confirmoInvoiceId },
          {
            status: "failed : incorrect amount",
            confirmoResponse: data
          },
          { new: true }
        );

        return res.status(400).json({
          error: "Incorrect payment amount received.",
          expected: expectedAmount,
          received: paidAmount
        });
      }

      // When Amount is correct, try to perform action with retries
      const maxRetries = 10;
      
      // Set initial status to processing
      await DepositModel.findOneAndUpdate(
        { confirmoInvoiceId },
        {
          status: "processing",
          confirmoResponse: data
        },
        { new: true }
      );
      
      // Execute the operation with retries
      const result = await retryOperation(
        () => performAction(data, deposit, confirmoInvoiceId, status),
        maxRetries
      );

      if (result.success) {
        return res.status(200).json({ 
          message: "Payment confirmed and updated successfully.",
          retryCount: result.retryCount
        });
      } else {
        // All retries failed, update deposit status to failed
        await DepositModel.findOneAndUpdate(
          { confirmoInvoiceId },
          {
            status: "failed : action execution failed after retries",
            confirmoResponse: data
          },
          { new: true }
        );
        
        return res.status(500).json({
          error: "Failed to process payment after multiple retries",
          details: result.error?.message || "Unknown error"
        });
      }
    }

    // For all other statuses (e.g., expired, failed, etc.)
    await DepositModel.findOneAndUpdate(
      { confirmoInvoiceId },
      {
        status: `failed : ${status}`,
        confirmoResponse: data
      },
      { new: true }
    );

    return res.status(200).json({ message: `Invoice status updated as '${status}'.` });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({
      error: "Error processing webhook",
      details: err.message
    });
  }
};

module.exports = { confirmoWebhook };