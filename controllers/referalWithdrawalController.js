const referalWithdrawalModel = require("../models/user/ReferralWithdrawalModel");

// add referal withDrawal ------------------
const addReferralWithrawalController = async (req, res) => {
  try {
    const {
      referralId,
      method,
      amount,
      status,
      managerIndex,
      totalBalance,
      level,
      userId,
    } = req.body;

    const updatedUser = await referalWithdrawalModel.create({
      referralId,
      method,
      amount,
      status,
      managerIndex,
      totalBalance,
      level,
      userId,
    });

    res.status(200).json({
      message: " Referral withdrwal details added",
      updatedUser,
    });
  } catch (error) {
    console.error("Error in  Referral withdrwal:", error);
    res.status(500).json({
      message: "Error adding Referral withdrwal",
      error: error.message,
    });
  }
};

// update referal withDrawal -------------

const updateReferralWithrawalController = async (req, res) => {
  const { id } = req.body;
  const { status } = req.body;
  try {
    const updatedDeposit = await referalWithdrawalModel.findByIdAndUpdate(
      id,
      { status: status },
      {
        new: true,
        runValidators: true,
      }
    );
    res.json({ msg: "Withdrwal updated successfully", updatedDeposit });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Failed to update withdrwal", error: error.message });
  }
};
// get all referral withdrawals ----------------

const getReferralWithrawal = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;

    let matchQuery = {};

    // Search by referralId, name, or email
    if (search) {
      matchQuery.$or = [
        { referralId: { $regex: search.toString(), $options: "i" } },
        { "userData.name": { $regex: search, $options: "i" } },
        { "userData.email": { $regex: search, $options: "i" } }
      ];
    }

    // Apply status filter if provided
    if (status) {
      matchQuery.status = status;
    }

    // Convert pagination params
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // MongoDB Aggregation Pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData"
        }
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
      { $match: matchQuery },
      { $sort: { updatedAt: -1 } }
    ];

    // Clone pipeline to count total documents correctly
    const totalPipeline = [...pipeline, { $count: "totalCount" }];
    const totalDocsResult = await referalWithdrawalModel.aggregate(totalPipeline);
    const totalWithdrawals = totalDocsResult.length > 0 ? totalDocsResult[0].totalCount : 0;

    // Apply pagination only if page and limit are provided
    if (page && limit) {
      pipeline.push({ $skip: skip }, { $limit: limitNumber });
    }

    // Fetch paginated data
    const data = await referalWithdrawalModel.aggregate(pipeline);

    return res.json({
      msg: "All referral withdrawals fetched successfully",
      status: true,
      data,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalWithdrawals / limitNumber),
        totalWithdrawals
      }
    });
  } catch (error) {
    console.error("Error in getReferralWithrawal:", error);
    res.status(500).json({ msg: "Failed to fetch referral withdrawals", status: false, error: error.message });
  }
};
// get referral withdrawals by id ----------------

const getIbWithdrawalByIdController = async (req, res) => {
  const userId = req.user.id;
  try {
    const data = await referalWithdrawalModel.find({ userId });
    if (!data) {
      return res.status(404).json({
        msg: "No withdrawal record found for the given ID",
        status: false,
      });
    }
    return res.status(200).json({
      msg: "IB withdrawal history fetched successfully",
      status: true,
      data,
    });
  } catch (error) {
    console.error("Error in getIbWithdrawalByIdController:", error.message);
    return res.status(500).json({
      msg: "An error occurred while processing your request",
      status: false,
    });
  }
};

module.exports = {
  addReferralWithrawalController,
  getReferralWithrawal,
  updateReferralWithrawalController,
  getIbWithdrawalByIdController,
};
