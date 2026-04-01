const accountTypeModel = require("../models/user/AccountTypeModel");
const adminIbModel = require("../models/user/adminIbModel");
const DepositModel = require("../models/user/DepositModel");
const customGroupModel=require("../models/user/CustomGroupModel");
// add deposit ---------------

const addAdminIbController = async (req, res) => {
  try {
    const Body = req.body;

    const newSaved = await adminIbModel.create({
      accountType: Body.accountType,
      accountTypeId: Body.accountTypeId,
      level: Body.level,
      commission: Body.commission,
    });

    return res.json({
      message: "IB added successfully",
      data: newSaved,
    });
  } catch (error) {
    console.error("Error during new IB:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Get all deposits -------------

const getAdminIbController = async (req, res) => {
  try {
    const data = await adminIbModel.find();
    res.json({ msg: "All data retrieved successfully", data });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Failed to retrieved data", error: error.message });
  }
};

// update deposit data -------------

const updateAdminIbController = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ msg: "ID parameter is required." });
    }
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ msg: "No data provided for update." });
    }

    const updatedDocument = await adminIbModel.findByIdAndUpdate(
      id, // The ID to match
      updateData, // Fields to update
      { new: true, runValidators: true } // Options: return updated document, enforce validators
    );

    // If no document was found, return a 404 error
    if (!updatedDocument) {
      return res
        .status(404)
        .json({ msg: "Admin IB not found with the given ID." });
    }

    // Respond with success
    res.json({
      msg: "Admin IB updated successfully",
      updatedDocument,
    });
  } catch (error) {
    // Handle server errors
    res
      .status(500)
      .json({ msg: "Failed to update Admin IB", error: error.message });
  }
};
const addLevelController = async (req, res) => {
  try {
    const Body = req.body;
    console.log("Body is",Body);

     const AccountTypeData = await customGroupModel.findById(Body.accountTypeId);
     console.log("AccountTypeData",AccountTypeData);

    const newSaved = await adminIbModel.create({
      accountType: AccountTypeData.customGroup,
      accountTypeId: Body.accountTypeId,
      commission: Body.commission,
      level:Body.level,
    });
    console.log("newSaved",newSaved);

    return res.json({
      message: "Level added successfully",
      data: newSaved,
    });
  } catch (error) {
    console.error("Error during new IB:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addAdminIbController,
  getAdminIbController,
  updateAdminIbController,
  addLevelController,
};
