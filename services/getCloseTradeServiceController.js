const { getCloseTradeAllUsers}=require("../services/meta.service")

const getCloseTradeServiceController=async(req,res)=>{
  try {
    const { mt5Account } = req.params;
    console.log(mt5Account);

        const startTime = "2021-07-20 00:00:00";
    const endTime = `${new Date().toISOString().slice(0, 10)} 23:59:59`;

    const data = await getCloseTradeAllUsers(startTime,endTime);
    // console.log("data",data);
    return res.status(200).json({ ok: true, data });
  } catch (e) {

    console.log("error",e);
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
}

module.exports={getCloseTradeServiceController}