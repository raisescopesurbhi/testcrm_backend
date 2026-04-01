const phaseModel = require("../models/user/PhaseModel");

// add phase controller
const addPhaseController = async (req, res) => {
  const {
    maxProfit,
    maxDailyLoss,
    maxOverallLoss,
    minTradingDays,
    phase,
    accountType,
  } = req.body;

  try {
    // Convert values to Infinity if they are "∞" or "Infinity"
    const processValue = (value) => {
      if (value === "∞" || value === "Infinity" || value === Infinity) {
        return Infinity;
      }
      // Handle empty string or undefined
      if (value === "" || value === undefined) {
        return undefined;
      }
      return Number(value);
    };

    const data = await phaseModel.create({
      accountType,
      phase,
      maxProfit: processValue(maxProfit),
      maxDailyLoss: processValue(maxDailyLoss),
      maxOverallLoss: processValue(maxOverallLoss),
      minTradingDays,
    });

    // Transform Infinity values to "∞" for response
    const responseData = {
      ...data.toObject(),
      maxProfit: data.maxProfit === Infinity ? "∞" : data.maxProfit,
      maxDailyLoss: data.maxDailyLoss === Infinity ? "∞" : data.maxDailyLoss,
      maxOverallLoss:
        data.maxOverallLoss === Infinity ? "∞" : data.maxOverallLoss,
    };

    res.json({
      msg: "Phase added",
      status: true,
      data: responseData,
    });
  } catch (error) {
    console.log("error in add phase--", error);

    // Enhanced error handling
    const errorMessage =
      error.name === "ValidationError"
        ? Object.values(error.errors)
            .map((err) => err.message)
            .join(", ")
        : error.message;

    res.status(500).json({
      msg: "Server error",
      status: false,
      error: errorMessage,
    });
  }
};

// get all platforms --------------

// get phases controller
const getAllPhaseController = async (req, res) => {
  try {
    const data = await phaseModel.find();

    // Transform the data before sending to frontend
    const transformedData = data.map((phase) => {
      const phaseObj = phase.toObject();
      return {
        ...phaseObj,
        maxProfit: phaseObj.maxProfit === Infinity ? "∞" : phaseObj.maxProfit,
        maxDailyLoss:
          phaseObj.maxDailyLoss === Infinity ? "∞" : phaseObj.maxDailyLoss,
        maxOverallLoss:
          phaseObj.maxOverallLoss === Infinity ? "∞" : phaseObj.maxOverallLoss,
      };
    });

    res.json({ msg: "Phases fetched", status: true, data: transformedData });
  } catch (error) {
    console.log("error in get phases--", error);
    res
      .status(500)
      .json({ msg: "Server error", status: false, error: error.message });
  }
};

//  update platform --------------

const updatePhaseController = async (req, res) => {
  const { id, ...updateFields } = req.body;

  try {
    const dataExist = await phaseModel.findById(id);
    if (dataExist) {
      const data = await phaseModel.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
        },

        { new: true, runValidators: true }
      );
      res.json({ msg: "Phase updated", status: true, data });
    }
    return res.json({ msg: "Phase not found", status: false });
  } catch (error) {
    console.log("error in update Phase--", error);
  }
};

//  delete platform --------------

const deletePhaseController = async (req, res) => {
  const { id } = req.query; // Get the id from query parameters

  try {
    const dataExist = await phaseModel.findById(id);
    if (dataExist) {
      const data = await phaseModel.findByIdAndDelete(id);
      return res.json({ msg: "Phase deleted", status: true, data });
    }
    return res.json({ msg: "Phase not found", status: false });
  } catch (error) {
    console.log("error in delete Phase--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  addPhaseController,
  getAllPhaseController,
  updatePhaseController,
  deletePhaseController,
};
