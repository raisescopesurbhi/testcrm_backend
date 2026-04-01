// add or update wallet details --------

const commissionModel = require("../models/user/CommissionModel");

const addCommissionController = async (req, res) => {
  try {
    const {
      mt5Account,
      referralId,
      phase,
      depositBalance,
      commission,
      accountSize,
      level,
      referralFrom,
      currentReferral,
      accountType,
    } = req.body;

    const savedData = await commissionModel.create({
      mt5Account,
      referralId,
      phase,
      depositBalance,
      commission,
      accountSize,
      accountType,
      level,
      referralFrom,
      currentReferral,
      accountType,
    });

    res.status(200).json({ message: "commission details added", savedData });
  } catch (error) {
    console.error("Error in addOrUpdateWalletDetails:", error);
    res.status(500).json({
      message: "Error adding commission details",
      error: error.message,
    });
  }
};
// get commissions data ----

const getCommissionController = async (req, res) => {
  try {
    const data = await commissionModel
      .find()
      .populate("referralFrom") // Populate all fields of referralFrom
      .populate("currentReferral"); // Populate all fields of currentReferral

    res
      .status(200)
      .json({ message: "All commissions fetched", status: true, data });
  } catch (error) {
    console.error("Error in retrieving commissions:", error);
    res.status(500).json({
      message: "Error in retrieving commissions",
      error: error.message,
    });
  }
};

module.exports = { addCommissionController, getCommissionController };
