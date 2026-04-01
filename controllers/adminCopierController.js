const UserModel=require("../models/user/userModel");
const { copyClient } = require("../services/metaClient");



const adminCopierController = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const masterAccounts = (user.accounts || []).map((ele) =>
      String(ele.accountNumber)
    );

    const externalResponse = await copyClient.post(
      `/api/getMasterDetailsByAccounts`,
      {
        userId: parseInt(process.env.User_Id),
        masterAccounts,
      }
    );

    const allMasters = Array.isArray(externalResponse?.data?.masterAccountsData)
      ? externalResponse.data.masterAccountsData
      : [];

    const allCopiers = allMasters.flatMap((item) => {
      const master = item?.master || {};
      const copiers = Array.isArray(item?.copiers) ? item.copiers : [];

      return copiers.map((copier, index) => ({
        id: Number(copier?.MT5Account || index + 1),
        accountNumber: String(copier?.MT5Account || ""),
        masterAccount: String(master?.MT5Account || ""),
        masterName: String(master?.name || ""),
        name: String(copier?.name || ""),
        balance: Number(copier?.balance || 0),
        equity: Number(copier?.equity || 0),
        totalTrades: Number(copier?.totalTrades || 0),
        profit: Number(copier?.totalProfit || 0),
        commissionPaid: Number(copier?.totalMasterCommission || 0),
        gain: Number(copier?.gain || 0),
        joinedDate: copier?.created_at
          ? String(copier.created_at).slice(0, 10)
          : "",
      }));
    });

    return res.status(200).json({
      success: true,
      message: "All copiers fetched successfully",
      data: allCopiers,
    });
  } catch (error) {
    console.error(
      "getAllCopiersController error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching all copiers",
      error: error.response?.data || error.message,
    });
  }
};
    

const adminDeleteController = async (req, res) => {
  try {
    const { mt5Account } = req.body;

    if (!mt5Account) {
      return res.status(400).json({ message: "mt5Account is required" });
    }

    const formData = new FormData();
    formData.append("mt5Account", mt5Account.toString());

    const deleteAccount = await copyClient.post("/api/deleteUserAccount", formData);

    return res.status(200).json({
      message: "Deleted successfully",
      data: deleteAccount.data,
    });
  } catch (err) {
    console.log("error", err?.response?.data || err.message);
    return res.status(500).json({
      message: "Server Error",
      err: err?.response?.data || err.message,
    });
  }
};


const adminDeleteAllController = async (req, res) => {
  try {
    const { mt5Accounts } = req.body;

    if (!Array.isArray(mt5Accounts) || mt5Accounts.length === 0) {
      return res.status(400).json({
        message: "mt5Accounts must be a non-empty array",
      });
    }

    const response = await copyClient.post("/api/deleteUserAccounts", {
      mt5Accounts,
    });

    return res.status(200).json({
      message: response?.data?.message || "All accounts deleted successfully",
      data: response?.data,
    });
  } catch (err) {
    console.log("delete all error", err?.response?.data || err.message);
    return res.status(500).json({
      message: err?.response?.data?.message || "Server Error",
      err: err?.response?.data || err.message,
    });
  }
};
module.exports={adminCopierController,adminDeleteController,adminDeleteAllController};