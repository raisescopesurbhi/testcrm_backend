const toggleModel = require("../models/user/ToggleModel");

// add platform --------------

const addToggleController = async (req, res) => {
  try {
    const { name, description,enabled } = req.body;

    if (!name || !description || !enabled) {
      return res.status(400).json({ msg: "Name ,description and enabled are required", status: false });
    }

    const data = await toggleModel.create({ name, description,enabled });

    return res.status(201).json({ msg: "toggleAdded Successfully", status: true, data });
  } catch (error) {
    console.error("Error in addToggleController:", error);
    return res.status(500).json({ msg: "Internal Server Error", status: false });
  }
};

const getToggleController = async (req, res) => {
  try {
    const data = await toggleModel.find({}).lean(); // ✅ array
    return res.status(200).json({ msg: "All toggles retrieved", status: true, data });
  } catch (error) {
    console.error("error in toggle retrieved--", error);
    return res.status(500).json({ msg: "Failed to retrieve toggles", status: false, data: [] });
  }
};



// const updateToggleController = async (req, res) => {
//   const { ...updateFields } = req.body;
//   const id = req.parms;

//   try {
//     const userExist = await toggleModel.findById(id);
//     if (userExist) {
//       const data = await toggleModel.findByIdAndUpdate(
//         id,
//         {
//           $set: updateFields,
//         },

//         { new: true, runValidators: true }
//       );
//       res.json({ msg: "toggle icons updated", status: true, data });
//     }
//     return res.json({ msg: "toggle not found", status: false });
//   } catch (error) {
//     console.log("error in toggle found--", error);
//   }
// };



// const updateToggleController = async (req, res) => {
//   const { enabled } = req.body;
//   const id = req.parms;

//   try {
//     const userExist = await toggleModel.findById(id);
//     if (userExist) {
//       const data = await toggleModel.findByIdAndUpdate(
//         id,
//         {
//           enabled : enabled,
//         }
//       );
//       res.json({ msg: "toggle icons updated", status: true, data });
//     }
//     return res.json({ msg: "toggle not found", status: false });
//   } catch (error) {
//     console.log("error in toggle found--", error);
//   }
// };



const updateToggleController = async (req, res) => {
  const { enabled } = req.body;
  const { id } = req.params;

  try {
    const data = await toggleModel.findByIdAndUpdate(
      id,
      { enabled },
      { new: true } // returns updated doc
    );

    if (!data) {
      return res.status(404).json({ msg: "toggle not found", status: false });
    }

    return res.json({ msg: "toggle icons updated", status: true, data });
  } catch (error) {
    console.log("error in updateToggleController --", error);
    return res.status(500).json({ msg: "server error", status: false });
  }
};





const deleteToggleController = async (req, res) => {
  const { id } = req.params; // Get the id from query parameters

  try {
    const userExist = await toggleModel.findById(id);
    if (userExist) {
      const data = await toggleModel.findByIdAndDelete(id);
      return res.json({ msg: "toggle Deleted", status: true, data });
    }
    return res.json({ msg: "toggle not found", status: false });
  } catch (error) {
    console.log("error in toggleModel--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  addToggleController,
  getToggleController,
  updateToggleController,
  deleteToggleController,
};