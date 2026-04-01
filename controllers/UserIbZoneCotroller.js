const CloseTradeModel = require("../models/user/closedTradesModel");
const userIbListModel = require("../models/user/userIbListModel");

const getAllUserIbZoneController = async (req, res) => {
  try {
    const userIbDocuments = await userIbListModel.find().populate("userId"); // Fetch all documents
    if (userIbDocuments.length === 0) {
      return res.status(404).json({ message: "No documents found." });
    }
    console.log(`${userIbDocuments}`);
    res.status(200).json({ data: userIbDocuments });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching documents.", error });
  }
};
const getIbZoneByReferralNoController = async (req, res) => {
  try {
    const { id } = req.params;
    const userIbDocuments = await userIbListModel.find({
      loggedUserReferralAccount: id,
    }); // Fetch all documents
    if (userIbDocuments.length === 0) {
      return res.status(404).json({ message: "No documents found." });
    }
    res.status(200).json({ data: userIbDocuments });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching documents.", error });
  }
};
const getIbCloseTradeController = async (req, res) => {
  try {
    const { id } = req.params;
    const closeTrades = await CloseTradeModel.find({ mt5Account: id });
    if (closeTrades.length === 0) {
      return res.status(404).json({ message: "No closeTrades found." });
    }
    res.status(200).json({ data: closeTrades });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching documents.", error });
  }
};

module.exports = {
  getAllUserIbZoneController,
  getIbZoneByReferralNoController,
  getIbCloseTradeController,
};
