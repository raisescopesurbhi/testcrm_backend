const rulesModel = require("../models/user/RulesModel");

// add rules --------------
const addRuleController = async (req, res) => {
  const { text, color, status } = req.body;

  try {
    const data = await rulesModel.create({
      text,
      color,
      status,
    });
    res.json({ msg: "Rule added", status: true, data });
  } catch (error) {
    console.log("error in add Rule--", error);
    res
      .status(500)
      .json({ msg: "Server error", status: false, error: error.message });
  }
};

// get all platforms --------------

const getAllRulesController = async (req, res) => {
  try {
    const data = await rulesModel.find();
    res.json({ msg: "All rules retrieved", status: true, data });
  } catch (error) {
    console.log("error in retrieved Rules--", error);
  }
};

//  update platform --------------

const updateRuleController = async (req, res) => {
  const { id, ...updateFields } = req.body;

  try {
    const userExist = await rulesModel.findById(id);
    if (userExist) {
      const data = await rulesModel.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
        },

        { new: true, runValidators: true }
      );
      res.json({ msg: "rule updated", status: true, data });
    }
    return res.json({ msg: "Rule not found", status: false });
  } catch (error) {
    console.log("error in update Rule--", error);
  }
};

//  delete platform --------------

const deleteRuleController = async (req, res) => {
  const { id } = req.query; // Get the id from query parameters

  try {
    const userExist = await rulesModel.findById(id);
    if (userExist) {
      const data = await rulesModel.findByIdAndDelete(id);
      return res.json({ msg: "Rule deleted", status: true, data });
    }
    return res.json({ msg: "Rule not found", status: false });
  } catch (error) {
    console.log("error in delete Rule--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  addRuleController,
  getAllRulesController,
  updateRuleController,
  deleteRuleController,
};
