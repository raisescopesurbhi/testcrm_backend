const express=require("express");
const {
  getMasterAccountsController

} =require( "../controllers/CopierController.js");


const apiKeyMiddleware = require("../middlewares/apiKeyMiddleware.js");

const router = express.Router();

/**
 * ✅ IMPORTANT (recommended):
 * Add auth middleware here (JWT etc.)
 * router.use(requireUserAuth)
 */

// Optional: ownership check helper (recommended)
// async function ensureAccountBelongsToUser(req, mt5Account) {
//   // Example logic (adapt to your schema):
//   // if (req.user.role === "admin") return;
//   // const owns = req.user.accounts?.some(a => String(a.accountNumber) === String(mt5Account));
//   // if (!owns) throw new Error("Unauthorized MT5 account");
// }

router.post('/get-masters', apiKeyMiddleware, getMasterAccountsController);  

module.exports=router;