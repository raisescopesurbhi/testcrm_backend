const challengesModel = require("../models/user/ChallengesModel.js");

// add method --------------
const addChallengeController = async (req, res) => {
  const Body = req.body;

  try {
    const data = await challengesModel.create({
      mt5Account: Body.mt5Account,
      type: Body.type,
      deposit: Body.deposit,
      balance: Body.balance,
      phase: Body.phase,
      reason: Body.reason,
      status: Body.status,
      accountSize: Body.accountSize,
      leverage: Body.leverage,
      masterPassword: Body.masterPassword,
      investarPassword: Body.investarPassword,
      userId: Body.userId,
    });
    res.json({ msg: "New challenge added", status: true, data });
  } catch (error) {
    console.log("error in add challenge--", error);
  }
};

// get all platforms --------------

const getChallengesController = async (req, res) => {
  try {
    const data = await challengesModel.find().populate("userId");
    res.json({ msg: "All challenges retrieved", data });
  } catch (error) {
    console.log("error in retrieve challenges--", error);
  }
};

//  update platform --------------

const updateChallengeController = async (req, res) => {
  const { mt5Account, ...updateFields } = req.body;

  try {
    const isAccount = await challengesModel.findOne({ mt5Account: mt5Account });
    if (isAccount) {
      const data = await challengesModel.findOneAndUpdate(
        { mt5Account: mt5Account },
        {
          $set: updateFields,
        },
        { new: true, runValidators: true }
      );

      return res.json({ msg: "Challenge updated", status: true, data });
    } else {
      return res.json({ msg: "Challenge not found", status: false });
    }
  } catch (error) {
    console.error("Error in update challenge:", error);
    return res.status(500).json({ msg: "Server error", status: false });
  }
};
//  delete platform --------------

const deleteChallengeController = async (req, res) => {
  const { id } = req.query;

  try {
    const userExist = await challengesModel.findById(id);
    if (userExist) {
      const data = await challengesModel.findByIdAndDelete(id);
      return res.json({ msg: "Challenge deleted", status: true, data });
    }
    return res.json({ msg: "challenge not found", status: false });
  } catch (error) {
    console.log("error in delete hallenge--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  addChallengeController,
  getChallengesController,
  updateChallengeController,
  deleteChallengeController,
};
