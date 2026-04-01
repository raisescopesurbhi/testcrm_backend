const DepositModel= require("../models/user/DepositModel");
const { makeDepositBalance}=require("../services/meta.service")


const makeDepositBalanceServiceController = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  try {

    // 1️⃣ deposit record get
    const depositData = await DepositModel.findById(id);

    if (!depositData) {
      return res.status(404).json({ message: "Deposit id not found" });
    }

    // 2️⃣ values from DB
    const MT5Account = depositData.mt5Account;
    const Amount = depositData.deposit;
    const status = depositData.status;

    // optional: prevent double approval
    // if (status === "Approved") {
    //   return res.status(400).json({ message: "Deposit already approved" });
    // }

    // 3️⃣ call meta api
    const metaResponse = await makeDepositBalance(
      MT5Account,
      Amount,
      comment || "deposit"
    );

    // 4️⃣ success check
    if (metaResponse?.status === 200 || metaResponse?.status === "success") {

      depositData.status = "Approved";
      await depositData.save(); // important

      return res.status(200).json({
        message: "Deposit approved successfully",
        deposit: depositData,
      });
    }
    else{
  return res.status(400).json({ message: "NOT DEPOSITED" });
  } 
}
  
  catch (e) {
    return res.status(500).json({
      message: "Server Error",
      error: e.message,
    });
  }
};

module.exports={makeDepositBalanceServiceController};