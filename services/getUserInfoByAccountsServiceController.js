const {getUserInfoByAccounts}= require("../services/meta.service")


const getUserInfoByAccountsServiceController=async(req,res)=>{
  try {
    const { accountIds } = req.body;

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ ok: false, message: "accountIds array required" });
    }

    const data = await getUserInfoByAccounts(accountIds);
    console.log("data",data);
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }

}
module.exports={getUserInfoByAccountsServiceController};