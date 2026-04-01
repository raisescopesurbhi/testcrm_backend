const {getCloseTradeAll}= require("../services/meta.service")

const getCloseTradeAllServiceController=async(req,res)=>{
  try {
    const { mt5Account } = req.params;

    const startTime = req.query.startTime || "2021-07-20 00:00:00";
    const endTime =
      req.query.endTime || `${new Date().toISOString().slice(0, 10)} 23:59:59`;

    const data = await getCloseTradeAll(mt5Account, startTime, endTime);
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
}

module.exports={getCloseTradeAllServiceController};