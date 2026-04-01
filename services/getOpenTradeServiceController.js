
const {getOpenTradesByAccount}=require("../services/meta.service")

const getOpenTradeServiceController=async(req,res)=>{
  try {
    const { mt5Account } = req.params;
    console.log(mt5Account);
    const data = await getOpenTradesByAccount(mt5Account);
    // console.log("data",data);
    return res.status(200).json({ ok: true, data });
  } catch (e) {

    console.log("error",e);
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
}

module.exports={getOpenTradeServiceController}