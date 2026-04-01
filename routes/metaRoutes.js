const express=require("express");
const {
  getUserInfoService,
  makeWithdrawBalanceService,
  makeDepositBalanceService,
  makeGroupsService,
  getgroups,       
  getUserInfoByAccounts,
  getOpenTradesByAccount,
  getCloseTradeAllUsers,
  getCloseTradeAll,
  getUserInfoByAccountsService,
  getOpenTradeService,
  getCloseTradeService,
  getCloseTradeAllService,
  getCloseTradeAllUsersService,
} =require( "../services/meta.service.js");

const {makeTransferServiceController}=require("../services/makeTransferServiceController.js")
const {makeDepositBalanceServiceController}=require("../services/makeDepositBalanceController.js")
const { default: TransferSnapshot } = require("../models/TransferSnapshot.js");
const apiKeyMiddleware = require("../middlewares/apiKeyMiddleware.js");
const {makeTransferController}=require("../");
const { makeGroupsServiceController } = require("../services/makeGroupsServiceController.js");

const {getUserInfoByAccountsServiceController} =require("../services/getUserInfoByAccountsServiceController.js");

const {getOpenTradeServiceController}=require("../services/getOpenTradeServiceController.js");
const { getCloseTradeServiceController } = require("../services/getCloseTradeServiceController.js");
const {makeWithdrawBalanceServiceController}=require("../services/makeWithdrawBalanceServiceController.js");

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

router.get("/user-info/:mt5Account",apiKeyMiddleware, getUserInfoService);




const isTxnSuccess = (x) =>
  String(x?.status || "").toLowerCase() === "success" &&
  x?.error === false &&
  x?.Result === true;

router.post("/transfer", apiKeyMiddleware, makeTransferServiceController);


router.post("/deposit-balance/:id", apiKeyMiddleware, makeDepositBalanceServiceController);

//  router.post("/deposit-balance", apiKeyMiddleware,makeDepositBalanceService)


// router.post("/withdrawal-balance",apiKeyMiddleware, makeWithdrawBalanceService)

router.post("/withdrawal-balance/:id", apiKeyMiddleware, makeWithdrawBalanceServiceController);


router.get("/groups",apiKeyMiddleware, makeGroupsServiceController)



// router.get("/groups",apiKeyMiddleware, makeGroupsService)
router.post("/user-info-by-accounts", apiKeyMiddleware,getUserInfoByAccountsServiceController)

// router.post("/user-info-by-accounts", apiKeyMiddleware,getUserInfoByAccountsService)

// router.get("/open-trades/:mt5Account", getOpenTradeService)

router.get("/open-trades/:mt5Account", getOpenTradeServiceController)

router.get("/close-trades/:mt5Account", getCloseTradeServiceController)
router.get("/close-trades-all/:mt5Account", apiKeyMiddleware,getCloseTradeAllService)


// router.get("/close-trades-all-users", apiKeyMiddleware,getCloseTradeAllUsersService)


module.exports=router;






