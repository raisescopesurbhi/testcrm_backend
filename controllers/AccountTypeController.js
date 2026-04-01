const accountTypeModel = require("../models/user/AccountTypeModel");

const addAccountTypeController = async (req, res) => {
  const { accountType, leverage, accountSize, apiGroup } = req.body;

  try {
    const newAccountConfig = new accountTypeModel({
      apiGroup,
      accountType,
      leverage,
      accountSize,
    });

    await newAccountConfig.save();

    return res.status(201).json({
      status: true,
      msg: "Account type added successfully",
      data: newAccountConfig,
    });
  } catch (error) {
    console.error("Error adding account configuration:", error);
    return res.status(500).json({
      status: false,
      msg: "Server error. Failed to add account configuration.",
    });
  }
};

// get all accountTypeData ----------------
const getAllAccountTypeController = async (req, res) => {
  try {
    const accountConfigurations = await accountTypeModel.find();

    res.status(200).json({
      status: true,
      msg: "Account configurations retrieved successfully",
      data: accountConfigurations,
    });
  } catch (error) {
    console.error("Error retrieving account configurations:", error);
    return res.status(500).json({
      status: false,
      msg: "Server error. Failed to retrieve account configurations.",
    });
  }
};
// update  accountType ----------------
const updateAccountTypeController = async (req, res) => {
  const { id, ...updateFields } = req.body;
  try {
    const userExist = await accountTypeModel.findById(id);
    if (userExist) {
      const data = await accountTypeModel.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
        },

        { new: true, runValidators: true }
      );
      res.json({ msg: "Account Type updated", status: true, data });
    }
    return res.json({ msg: "Account type not found", status: false });
  } catch (error) {
    console.error("Error update account type:", error);
    return res.status(500).json({
      status: false,
      msg: "Server error. Failed to update account type.",
    });
  }
};

// delete  accountType ----------------

const deleteAccountTypeController = async (req, res) => {
  const { id } = req.query;

  try {
    const userExist = await accountTypeModel.findById(req.user.id);
    if (userExist) {
      const data = await accountTypeModel.findByIdAndDelete(id);
      return res.json({ msg: "Account type deleted", status: true, data });
    }
    return res.json({ msg: "Account type not found", status: false });
  } catch (error) {
    console.log("error in delete account type--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};
module.exports = {
  addAccountTypeController,
  getAllAccountTypeController,
  updateAccountTypeController,
  deleteAccountTypeController,
};
