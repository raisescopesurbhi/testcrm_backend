const customGroupModel = require("../models/user/CustomGroupModel");

const addCustomGroupController = async (req, res) => {
  const Body = req.body;

  try {
    const data = await customGroupModel.create({
      apiGroup: Body.apiGroup,
      customGroup: Body.customGroup,
    });
    res.json({ msg: "Group added", status: true, data });
  } catch (error) {
    console.log("error in add Group--", error);
  }
};

const getCustomGroupsController = async (req, res) => {
  try {
    const data = await customGroupModel.find();
    res.json({ msg: "All custom group retrieved", data });
  } catch (error) {
    console.log("error in retrieved custom groups--", error);
  }
};

const updateCustomGroupController = async (req, res) => {
  const { id, ...updateFields } = req.body;

  try {
    const userExist = await customGroupModel.findById(id);
    if (userExist) {
      const data = await customGroupModel.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
        },

        { new: true, runValidators: true }
      );
      res.json({ msg: "Group updated", status: true, data });
    }
    return res.json({ msg: "Group not found", status: false });
  } catch (error) {
    console.log("error in update Group--", error);
  }
};

const deleteCustomGroupController = async (req, res) => {
  const { id } = req.query;

  try {
    const userExist = await customGroupModel.findById(id);
    if (userExist) {
      const data = await customGroupModel.findByIdAndDelete(id);
      return res.json({ msg: "cutom group deleted", status: true, data });
    }
    return res.json({ msg: "custom group not found", status: false });
  } catch (error) {
    console.log("error in delete custom group--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  addCustomGroupController,
  getCustomGroupsController,
  updateCustomGroupController,
  deleteCustomGroupController,
};
