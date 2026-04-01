const UserLogModel = require("../models/user/UserLogModel");
// get all data ----
const getAllLogController = async (req, res) => {
  try {
    const data = await UserLogModel.find().populate("userId");

    if (!data || data.length === 0) {
      return res.status(404).json({ msg: "No logs found" });
    }
    res.json({
      msg: "Data retrieved successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Failed to retrieve data",
      error: error.message,
    });
  }
};

// Get data by id -------

const getLogByIdController = async (req, res) => {
  const { id } = req.params; // Assuming userId is passed as a route parameter
  try {
    const data = await UserLogModel.find({ userId: id }).populate("userId");
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No data found for this user" });
    }
    res.json({ msg: "User's data retrieved successfully", data });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to retrieve data", error: error.message });
  }
};

module.exports = { getLogByIdController, getAllLogController };
