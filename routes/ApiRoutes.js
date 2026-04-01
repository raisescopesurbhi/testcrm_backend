const express = require("express");

const {
  addPlatformController,
  getPlatformsController,
  updatePlatformController,
  deletePlatformController,
} = require("../controllers/accountControllers.js");
const {
  addPaymentMethodController,
  getpaymentMethodsController,
  updatePaymentMethodController,
  deletePaymentMethodController,
} = require("../controllers/paymentMethodController.js");
const {
  addAccountTypeController,
  getAllAccountTypeController,   
  updateAccountTypeController,
  deleteAccountTypeController,
} = require("../controllers/AccountTypeController.js");
const {
  updateCustomGroupController,
  addCustomGroupController,
  deleteCustomGroupController,
  getCustomGroupsController,
} = require("../controllers/CustomGroupController.js");
const {
  registerUserController,
  loginUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  sendVerificationLinkController,
  verifyEmailController,
  addOrUpdateWalletDetails,
  addOrUpdateBankDetails,
  addOrUpdateKycDetails,
  sendCutomMailController,
  getUserByEmailController,  
  sendForgotPasswordController,
  resetPasswordController,
  addMt5AccountController,  
  updatePasswordController,
  getKycUsersController,
  updateKycStatusController,
  withdrawIBBalanceController,
  getUsersListController,
} = require("../controllers/UserController.js");
const {
  depositController,
  getDepositDataController,  
  updateDepositDataController,
  addDepositController,  
  getDepositDataByIdController,
  createPaymentController,
  paymentcallbackController,
  nowPaymentsCallbackController,  
} = require("../controllers/depositController.js");
const {
  withdrawalController,  
  getWithdrawalDataController,
  updateWithdrawalDataController,
  getWithdrawalByIdController,
} = require("../controllers/withdrwalController.js");
const {
  adminSignupController,
  adminLoginController,
  createOrUpdateAdmin,
  adminGetUserController,
} = require("../controllers/adminUserController.js");
const {
  addCommissionController,
  getCommissionController,
} = require("../controllers/CommissionController.js");
const {
  addOrUpdateReferralWithrawal,
  getReferralWithrawal,
  addReferralWithrawal,
  addReferralWithrawalController,
  updateReferralWithrawalController,
  getIbWithdrawalByIdController,
} = require("../controllers/referalWithdrawalController.js");
const {
  addRuleController,
  getAllRulesController,
  updateRuleController,
  deleteRuleController,
} = require("../controllers/RulesControllers.js");  
const {
  addPhaseController,
  getAllPhaseController,   
  updatePhaseController,
  deletePhaseController,
} = require("../controllers/PhaseControllers.js");
const apiKeyMiddleware = require("../middlewares/apiKeyMiddleware.js");
const {
  getAllLogController,
  getLogByIdController,
} = require("../controllers/userLogController.js");
const {
  updateInvestorPasswordController,
  updateMasterPasswordController,
} = require("../controllers/userAccountController.js");
const {
  addAdminIbController,
  getAdminIbController,
  updateAdminIbController,
  addLevelController,
} = require("../controllers/adminIbController.js");
const {
  getAllUserIbZoneController,
  getIbZoneByReferralNoController,
  getIbCloseTradeController,   
} = require("../controllers/UserIbZoneCotroller.js");  
const {
  getSiteConfigController,
  updateSiteConfigController,
} = require("../controllers/siteConfigController.js");
const {
  getUserStatsController,
  getDepositStatsController,
  getWithdrawalStatsController,
  getIBWithdrawalsStatsController,
} = require("../controllers/ReportController.js");
const {
  sendMailsInLoopController,   
} = require("../controllers/customEmailController.js");
const {
  sendOtpController,
  verifyOtpController,
} = require("../controllers/otpController.js");  
const {    
  createCopyRequestController,
  copyRequestHistoryController,    
  updateCopyRequestStatusController,
} = require("../controllers/CopyRequestController.js");  

const {     
  addToggleController,
  getToggleController,      
  updateToggleController,
  deleteToggleController,  
} = require("../controllers/ToggleController.js");   
const { verifySAdminPassword } = require("../controllers/sAdminController.js");
const { user_getAllNotifications, mark_notification_read, admin_mark_notification_read, admin_getAllNotifications } = require("../controllers/notificationController.js");
const { createPayNowPayment } = require("../controllers/getway/paymentController.js");
const { checkNowPaymentStatus, nowpaymentsIpnStoreOnly } = require("../controllers/getway/verifyPaygatePayment.js");
const {  getTransferRecordsController} = require("../controllers/getTransferRecordsController.js");
const {authenticate}=require("../middlewares/authenticate.js");
const {authorize}=require("../middlewares/authorize.js");
const {loginLimiter}=require("../middlewares/loginLimiter.js");



    
   
const router = express.Router();                          
// user routes -----------------  

router.post("/nowpayments/payment-callback", nowPaymentsCallbackController);
  
                  
router.post("/signup", apiKeyMiddleware, registerUserController);   
router.post("/signup/:id", apiKeyMiddleware, registerUserController);
router.post("/login", loginLimiter,  apiKeyMiddleware, loginUserController);  
router.get("/get-users", apiKeyMiddleware, getUsersController);  
router.get("/get-user", apiKeyMiddleware, getUserByIdController);
router.get("/forgot-password",authenticate,authorize("client"), apiKeyMiddleware, getUserByEmailController);    
router.put("/update-user", apiKeyMiddleware, updateUserController);
router.post("/custom-mail", apiKeyMiddleware, sendCutomMailController);


router.post("/send-link", authenticate,authorize("client"), sendVerificationLinkController);
router.post("/verify-link",authenticate,authorize("client") , verifyEmailController);
router.put(
  "/:userId/wallet-details",
  authenticate,authorize("client"),
  addOrUpdateWalletDetails
);
router.put("/:userId/bank-details", authenticate,authorize("client") ,addOrUpdateBankDetails);
router.put("/:userId/kyc-details", addOrUpdateKycDetails);
router.put(   
  "/user/:userId/kyc-status",authenticate,authorize("client"),
  updateKycStatusController,
  addOrUpdateKycDetails
);
router.post("/send-reset-link", authenticate,authorize("client"),sendForgotPasswordController);
router.post(
  "/reset-password/:token",authenticate,authorize("client"),
  resetPasswordController
);
// router.post(
//   "/add-mt5-account/:userId",
//   apiKeyMiddleware,  
//   addMt5AccountController  
// );

router.post(
  "/create-mt5-account/:userId",authenticate,authorize("client"),
  addMt5AccountController
);

router.post("/update-password",authenticate,authorize("client"), updatePasswordController);
router.get("/kyc-users", apiKeyMiddleware, getKycUsersController);
router.post("/send-emails", apiKeyMiddleware, sendMailsInLoopController);

// deposit routes ------------------ 
     
router.post("/paygate/create-wallet", createPaymentController); 

router.get("/paygate/payment-callback", paymentcallbackController);  

router.post("/deposit",  authenticate, authorize("client"),  addDepositController);
router.get("/deposits", apiKeyMiddleware, getDepositDataController);
router.put("/update-deposit", apiKeyMiddleware, updateDepositDataController);
router.get("/deposit/:userId", apiKeyMiddleware, getDepositDataByIdController);
router.get("/transfer-records",authenticate,authorize("client"), getTransferRecordsController);

// withdrawal routes ----------------------

router.post("/withdrawal", authenticate,authorize("client"), withdrawalController);
router.get("/withdrawals", apiKeyMiddleware, getWithdrawalDataController);
router.get(
  "/withdrawals/:userId",
  apiKeyMiddleware,
  getWithdrawalByIdController
);
router.put(
  "/update-withdrawal",  
  apiKeyMiddleware,
  updateWithdrawalDataController
);

// platform routes ---------------

router.post("/add-platform", apiKeyMiddleware, addPlatformController);
router.get("/get-platforms", apiKeyMiddleware, getPlatformsController);
router.put("/update-platform", apiKeyMiddleware, updatePlatformController);
router.delete("/delete-platform", apiKeyMiddleware, deletePlatformController);

// payment methods routes ---------------

router.get(
  "/get-all-notification/:userId",
  apiKeyMiddleware,
  user_getAllNotifications  
);

router.put(
  "/mark-notification-read/:id",
  apiKeyMiddleware,
  mark_notification_read
);

router.post(  
  "/add-payment-method",
  apiKeyMiddleware,
  addPaymentMethodController
);
router.get(
  "/get-payment-methods",
  apiKeyMiddleware,
  getpaymentMethodsController  
);
router.put(
  "/update-payment-method",
  apiKeyMiddleware,
  updatePaymentMethodController
);
router.delete(
  "/delete-payment-method",  
  apiKeyMiddleware,  
  deletePaymentMethodController
);   

// account config -------------------

router.post("/add-account-type", apiKeyMiddleware, addAccountTypeController);  
router.get("/get-account-types", apiKeyMiddleware, getAllAccountTypeController);
router.put(
  "/update-account-type",
  apiKeyMiddleware,
  updateAccountTypeController
);
router.delete(
  "/delete-account-type",
  apiKeyMiddleware,  
  deleteAccountTypeController  
);

// custom group -----------------

router.get("/get-custom-groups", apiKeyMiddleware, getCustomGroupsController);  
router.post("/add-custom-group", apiKeyMiddleware, addCustomGroupController);
router.put(
  "/update-custom-group",
  apiKeyMiddleware,
  updateCustomGroupController
);
router.delete(
  "/delete-custom-group",
  apiKeyMiddleware,
  deleteCustomGroupController
);

// admin authentication  -----------------------------

router.post("/admin/create-n-update", apiKeyMiddleware, createOrUpdateAdmin);
router.post("/admin/login", apiKeyMiddleware, adminLoginController);
router.get("/admin/user", apiKeyMiddleware, adminGetUserController);
router.get("/admin/user-list", apiKeyMiddleware, getUsersListController);


// ********************** admin notification  -----------------------------

router.get(
  "/admin/get-all-notification/:userId",
  apiKeyMiddleware,
  admin_getAllNotifications
);
  
router.put(
  "/admin/mark-notification-read/:id",
  apiKeyMiddleware,
  admin_mark_notification_read
);

// User IB commissions  -----------------------------

router.post("/add-commission", apiKeyMiddleware, addCommissionController);
router.get("/get-commissions", apiKeyMiddleware, getCommissionController);
router.post(
  "/add-referral-withdrawal",
  apiKeyMiddleware,
  addReferralWithrawalController
);
router.put(
  "/update-referral-withdrawal",
  apiKeyMiddleware,
  updateReferralWithrawalController
);
router.get("/referral-withdrawals", apiKeyMiddleware, getReferralWithrawal);
router.get(
  "/ib-withdrawals/:id",
  apiKeyMiddleware,
  getIbWithdrawalByIdController
);

// Rule routes ---------------

router.post("/add-rule", apiKeyMiddleware, addRuleController);  
router.get("/get-rules", apiKeyMiddleware, getAllRulesController);
router.put("/update-rule", apiKeyMiddleware, updateRuleController);
router.delete("/delete-rule", apiKeyMiddleware, deleteRuleController);

// phase routes ---------------

router.post("/add-phase", apiKeyMiddleware, addPhaseController);
router.get("/get-phases", apiKeyMiddleware, getAllPhaseController);
router.put("/update-phase", apiKeyMiddleware, updatePhaseController);
router.delete("/delete-phase", apiKeyMiddleware, deletePhaseController);

// log controller --------------
router.get("/logs", apiKeyMiddleware, getAllLogController);
router.get("/log/:id", apiKeyMiddleware, getLogByIdController);
// user account routes -----
router.post(
  "/update-master-password",
  apiKeyMiddleware,
  updateMasterPasswordController
);
router.post(
  "/update-investor-password",
  apiKeyMiddleware,
  updateInvestorPasswordController
);
// admin IB routes -----  

router.post("/add-admin-ib", apiKeyMiddleware, addAdminIbController);
router.get("/admin-ibs", apiKeyMiddleware, getAdminIbController);
router.put("/update-admin-ib/:id", apiKeyMiddleware, updateAdminIbController);
router.post("/add-level",apiKeyMiddleware, addLevelController);
// user IB Zone routes -----

router.get("/user-zone-ibs", apiKeyMiddleware, getAllUserIbZoneController);
router.get(
  "/user-zone-ibs/:id",
  apiKeyMiddleware,
  getIbZoneByReferralNoController
);
router.get(   
  "/user-ib-close-trade/:id",     
  apiKeyMiddleware,
  getIbCloseTradeController
);
// site config routes -----

router.get("/site-config", apiKeyMiddleware, getSiteConfigController);  
router.put("/site-config", apiKeyMiddleware, updateSiteConfigController);

//ui toggle routes
router.post("/add-toggle", apiKeyMiddleware, addToggleController);

router.get("/get-toogle", apiKeyMiddleware, getToggleController);  
   




router.put("/update-toogle/:id", apiKeyMiddleware, updateToggleController);
      


router.delete("/delete-toogle/:id", apiKeyMiddleware, deleteToggleController);

// reports route ------
router.get("/user-report", apiKeyMiddleware, getUserStatsController);
router.get("/deposit-report", apiKeyMiddleware, getDepositStatsController);
router.get(
  "/withdrawal-report",
  apiKeyMiddleware,
  getWithdrawalStatsController
);
router.get(
  "/ib-withdrawal-report",
  apiKeyMiddleware,
  getIBWithdrawalsStatsController  
);
// otp section ----
router.post("/send-otp", apiKeyMiddleware, sendOtpController);
router.post("/verify-otp", apiKeyMiddleware, verifyOtpController);

// copy-request  ----
// router.post(
//   "/create-copy-request",
//   apiKeyMiddleware,
//   createCopyRequestController
// );


// router.get("/copy-requests", apiKeyMiddleware, copyRequestHistoryController);
// router.put(
//   "/update-copy-request/:id",
//   apiKeyMiddleware,
//   updateCopyRequestStatusController
// );

// verify s-admin password ----   
router.post("/s-admin-login", verifySAdminPassword);
// ib balance------
router.post("/withdraw-ib-balance", withdrawIBBalanceController);



// ******************************************** abhishek Routing  start ******************************

// router.post("/create-nowPayment-payment", createPayNowPayment);
// router.get("/nowpayments/check-status", checkNowPaymentStatus);
// router.post("/webhooks/nowpayments", nowpaymentsIpnStoreOnly);

// ******************************************** abhishek Routing  start ******************************

module.exports = router;
