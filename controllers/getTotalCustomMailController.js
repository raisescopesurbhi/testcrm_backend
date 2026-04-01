const express=require("express");
const CustomMail=require("../models/MailReference/MailTransportation");


// const getTotalCustomMailCountController = async (req, res) => {
//   try {
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     const endOfDay = new Date();
//     endOfDay.setHours(23, 59, 59, 999);

//     const totalMailCountToday = await CustomMail.countDocuments({
//       createdAt: {
//         $gte: startOfDay,
//         $lte: endOfDay,
//       },
//     });

//     return res.status(200).json({
//       message: "Total mail count fetched successfully",
//       totalMailCountToday,
//     });
//   } catch (err) {
//     console.log("get total custom mail count error", err?.message);
//     return res.status(500).json({
//       message: "Server Error",
//       err: err?.message,
//     });
//   }
// };



const getTotalCustomMailCountController = async (req, res) => {
  try {
    const totalMailCount = await CustomMail.countDocuments({});

    return res.status(200).json({
      message: "Total mail count fetched successfully",
      totalMailCount,
    });
  } catch (error) {
    console.log("get total mail count error", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports={getTotalCustomMailCountController};