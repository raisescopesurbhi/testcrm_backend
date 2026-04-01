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