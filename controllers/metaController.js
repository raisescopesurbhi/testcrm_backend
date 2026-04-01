const {getUserInfo,makeDepositBalance} = require("../services/meta.service");

 

exports.getUserInfoController = async (req, res) => {
  try {
    const { mt5Account } = req.params;

    if (!mt5Account) {
      return res.status(400).json({
        ok: false,
        message: "MT5 account is required",
      });
    }

    const data = await getUserInfo(mt5Account);

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Meta user-info error:", error);

    res.status(500).json({
      ok: false,
      message: error.message || "Meta error",
    });
  }
};


