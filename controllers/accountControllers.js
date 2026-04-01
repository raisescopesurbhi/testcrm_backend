const platformModel = require("../models/user/PlatFormModel");

// add platform --------------

const addPlatformController = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name || !status) {
      return res.status(400).json({ msg: "Name and status are required", status: false });
    }

    const data = await platformModel.create({ name, status });

    return res.status(201).json({ msg: "Platform added", status: true, data });
  } catch (error) {
    console.error("Error in addPlatformController:", error);
    return res.status(500).json({ msg: "Internal Server Error", status: false });
  }
};


// get all platforms ---------

const getPlatformsController = async (req, res) => {
  try {
    const data = await platformModel.find();
    res.json({ msg: "All platforms retrieved", data });
  } catch (error) {
    console.log("error in addPlatform--", error);
  }
};

//  update platform --------------

const updatePlatformController = async (req, res) => {
  const { id, ...updateFields } = req.body;

  try {
    const userExist = await platformModel.findById(id);
    if (userExist) {
      const data = await platformModel.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
        },

        { new: true, runValidators: true }
      );
      res.json({ msg: "Platform updated", status: true, data });
    }
    return res.json({ msg: "Platform not found", status: false });
  } catch (error) {
    console.log("error in addPlatform--", error);
  }
};
//  delete platform --------------

const deletePlatformController = async (req, res) => {
  const { id } = req.query; // Get the id from query parameters

  try {
    const userExist = await platformModel.findById(id);
    if (userExist) {
      const data = await platformModel.findByIdAndDelete(id);
      return res.json({ msg: "Platform deleted", status: true, data });
    }
    return res.json({ msg: "Platform not found", status: false });
  } catch (error) {
    console.log("error in deletePlatformModel--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  addPlatformController,
  getPlatformsController,
  updatePlatformController,
  deletePlatformController,
};
