// /const adminIbModel = require("../models/user/adminIbModel");


// const addLevelController = async (req, res) => {
//   try {
//     const Body=req.body;

//     const newSaved = await adminIbModel.create({
//       accountType: Body.accountType,
//       accountTypeId: Body.accountTypeId,
//       level: Body.level,
//       commission: Body.commission,
//     });

//     return res.json({
//       message: "Level added successfully",
//       data: newSaved,
//     });
//   } catch (error) {
//     console.error("Error during new IB:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// // Get all deposits -----
// module.exports(
//     addLevelController,
// )