const express=require("express");
const {
  createMasterController,
  updateMasterAccountByIdController,
  deleteMasterController,
  getMasterAccountIdController,
  getMasterAccountsController,
  getTradeHistoryController,
  getOpenTradeServiceController,
  getCloseTradeServiceController,


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

// @route   POST /api/copy-trading/trade-history
// @access  Private (Client only)
router.post('/trade-history',apiKeyMiddleware, getTradeHistoryController);  // Get a single master
// router.post('/masters', apiKeyMiddleware, createMasterController);   // Create a master
// router.put('/masters/:id', apiKeyMiddleware,updateMasterAccountByIdController);  // Update a master
// // router.get('/masters/:id/copiers', protect, masterController.getMasterCopiers);
// router.delete('/masters/:id', apiKeyMiddleware,deleteMasterController);

// router.get('/get-all-masters', apiKeyMiddleware, getMasterAccountsController);

router.get("/open-trades/:mt5Account", getOpenTradeServiceController)

router.get("/close-trades", getCloseTradeServiceController)









// router.get("/groups",apiKeyMiddleware, makeGroupsService)


// router.get("/close-trades-all-users", apiKeyMiddleware,getCloseTradeAllUsersService)


module.exports=router;






