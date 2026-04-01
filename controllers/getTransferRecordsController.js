
const TransferSnapshot = require("../models/TransferSnapshot.js");
const getTransferRecordsController = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
   
    let query = {};
                                                                      
    // Apply search filter (name, email, mt5Account)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },   
        { mt5Account: { $regex: search, $options: "i" } },
      ];
    }

    // Apply status filter (pending, approved, rejected)  
    if (status) {
      query.status = status; // Will match exactly the provided status value
    }

    // If pagination is provided, apply it
    if (page && limit) {
      const pageNumber = parseInt(page) || 1;
      const limitNumber = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const data = await TransferSnapshot.find(query)
        .populate("userId")
        .sort({ updatedAt: -1 }) // Sort by latest updatedAt first
        .skip(skip)
        .limit(limitNumber);

      const total = await TransferSnapshotcountDocuments(query);

      return res.json({
        msg: "Transfer r retrieved successfully with pagination",
        data,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalDeposits: total,
        },
      });
    }

    // If no pagination, return all deposits
    const data = await TransferSnapshot.find(query).populate("userId");
    return res.json({ msg: "All transfer records retrieved", data });
  } catch (error) {
    console.error("Error in retrieving transfer records:", error);
    res
      .status(500)
      .json({ msg: "Failed to retrieve transfer records", error: error.message });
  }
};
module.exports = { getTransferRecordsController };