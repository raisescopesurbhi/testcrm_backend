const UserModel = require("../models/user/userModel");

const updateMasterPasswordController = async (req, res) => {
  const { userId, accountId, newPassword } = req.body;

  if (!userId || !accountId || !newPassword) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    const user = await UserModel.findOneAndUpdate(
      { _id: userId, "accounts._id": accountId }, // Match user and account
      { $set: { "accounts.$.masterPassword": newPassword } }, // Update masterPassword
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ msg: "Account not found" });
    }
    const updatedAccount = user.accounts.find(
      (account) => account._id.toString() === accountId
    );

    res.json({ msg: "Master password updated successfully", updatedAccount });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Failed to update master password", error: error.message });
  }
};
const updateInvestorPasswordController = async (req, res) => {
  const { userId, accountId, newPassword } = req.body;

  if (!userId || !accountId || !newPassword) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    const user = await UserModel.findOneAndUpdate(
      { _id: userId, "accounts._id": accountId }, // Match user and account
      { $set: { "accounts.$.investorPassword": newPassword } }, // Update masterPassword
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ msg: "Account not found" });
    }
    const updatedAccount = user.accounts.find(
      (account) => account._id.toString() === accountId
    );

    res.json({ msg: "Investor password updated successfully", updatedAccount });
  } catch (error) {
    res.status(500).json({
      msg: "Failed to update Investor password",
      error: error.message,
    });
  }
};

module.exports = {
  updateInvestorPasswordController,
  updateMasterPasswordController,
};
