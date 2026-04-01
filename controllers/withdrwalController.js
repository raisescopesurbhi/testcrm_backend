const WithdawalModel = require("../models/user/WithdrawalModel");

// add withdrawal ------------------
const withdrawalController = async (req, res) => {
  try {
    const Body = req.body;

    const newWithdrawal = await WithdawalModel.create({
      mt5Account: Body.mt5Account,
      method: Body.method,
      accountType: Body.accountType,
      amount: Body.amount,
      status: Body.status,
      userId: Body.userId,
      lastBalance: Body.lastBalance,
    });
    res.json({ msg: "data created successfully", data: newWithdrawal });
  } catch (error) {
    console.error("Error during withdrawal:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all withdrawal data -------------

const getWithdrawalDataController = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;

    let matchQuery = {};

    // Search by mt5Account, firstName, or email
    if (search) {
      matchQuery.$or = [
        { mt5Account: { $regex: search.toString(), $options: "i" } }, // mt5Account search
        { "userData.firstName": { $regex: search, $options: "i" } }, // firstName search
        { "userData.email": { $regex: search, $options: "i" } } // email search
      ];
    }

    // Apply status filter if provided
    if (status) {
      matchQuery.status = status; // Filter withdrawals by status
    }

    // Pagination setup
    const pageNumber = page ? parseInt(page) || 1 : null;
    const limitNumber = limit ? parseInt(limit) || 10 : null;
    const skip = pageNumber && limitNumber ? (pageNumber - 1) * limitNumber : 0;

    // MongoDB Aggregation Pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users", // Ensure this matches your actual User collection name
          localField: "userId",
          foreignField: "_id",
          as: "userData"
        }
      },
      { $unwind: "$userData" }, // Flatten the user data
      { $match: matchQuery }, // Apply search + status filter
      { $sort: { updatedAt: -1 } } // Sort by newest first
    ];

    // If pagination is requested, apply limit and skip
    if (pageNumber && limitNumber) {
      pipeline.push({ $skip: skip }, { $limit: limitNumber });
    }

    // Get data from the database
    const data = await WithdawalModel.aggregate(pipeline);

    // Get total count for pagination
    const total = await WithdawalModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData"
        }
      },
      { $unwind: "$userData" },
      { $match: matchQuery },
      { $count: "totalCount" }
    ]);

    return res.json({
      msg: "Withdrawals retrieved successfully",
      data,
      pagination: pageNumber && limitNumber ? {
        currentPage: pageNumber,
        totalPages: Math.ceil((total[0]?.totalCount || 0) / limitNumber),
        totalWithdrawals: total[0]?.totalCount || 0
      } : null
    });

  } catch (error) {
    console.error("Error in retrieving withdrawals:", error);
    res.status(500).json({ msg: "Failed to retrieve withdrawals", error: error.message });
  }
};
// Get withdrawal by id -------------

const getWithdrawalByIdController = async (req, res) => {
  const  userId  = req.user.id; // Assuming userId is passed as a route parameter
  try {
    const data = await WithdawalModel.find({ userId }).populate("userId");
    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: "No withdrawal found for this user" , userId :  req.user , data : data });
    }
    res.json({ msg: "User's withdrawal data retrieved successfully", data  , userId : userId});
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve withdrawals",
      error: error.message,
    });
  }
};

// update withdrawal data -------------

const updateWithdrawalDataController = async (req, res) => {
  const id = req.body._id;
  const status = req.body.status;
  try {
    const updatedDeposit = await WithdawalModel.findByIdAndUpdate(
      id,
      { status: status },
      {
        new: true,
        runValidators: true,
      }
    );
    res.json({ msg: "Withdrawal updated successfully", updatedDeposit });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Failed to update withdrwal", error: error.message });
  }
};

module.exports = {
  withdrawalController,
  getWithdrawalDataController,
  updateWithdrawalDataController,
  getWithdrawalByIdController,
};
