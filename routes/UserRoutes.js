const express=require("express");

const {
  registerUserController,
  loginUserController,
  getUsersController,
  getUserByIdController,
  sendVerificationLinkController,
  verifyEmailController,
  addOrUpdateWalletDetails,
  addOrUpdateBankDetails,
  addOrUpdateKycDetails,
  sendCutomMailController,
  updateUserController,
  getUserByEmailController,  
  sendForgotPasswordController,
  resetPasswordController,
  addMt5AccountController,  
  updatePasswordController,
  clientlogOutUserController,
  userInfoController,

  updateKycStatusController,
} = require("../controllers/UserController.js");


const {
  depositController,
  addDepositController,  
  getDepositDataByIdController, 
} = require("../controllers/depositController.js");

const {
  withdrawalController,
  getWithdrawalByIdController,
} = require("../controllers/withdrwalController.js");
const {
  sendOtpController,
  verifyOtpController,
} = require("../controllers/otpController.js"); 

const {     
  getToggleController,       
} = require("../controllers/ToggleController.js"); 

const {  getTransferRecordsController} = require("../controllers/getTransferRecordsController.js");


const { user_getAllNotifications, mark_notification_read, admin_mark_notification_read, admin_getAllNotifications } = require("../controllers/notificationController.js");


const {
  updateInvestorPasswordController,
  updateMasterPasswordController,
} = require("../controllers/userAccountController.js");

const {
  getSiteConfigController,
} = require("../controllers/siteConfigController.js");

const {
  getAllUserIbZoneController,
  getIbZoneByReferralNoController,
  getIbCloseTradeController,   
} = require("../controllers/UserIbZoneCotroller.js");  


const {
  getIbWithdrawalByIdController,
} = require("../controllers/referalWithdrawalController.js");

const {
  addReferralWithrawalController,
} = require("../controllers/referalWithdrawalController.js");



const {
  getAllLogController,
  getLogByIdController,
} = require("../controllers/userLogController.js");



const {
  getpaymentMethodsController,
} = require("../controllers/paymentMethodController.js"); 
const {
  getAllAccountTypeController,
} = require("../controllers/AccountTypeController.js");

const {
  
  getPlatformsController,

} = require("../controllers/accountControllers.js");



const apiKeyMiddleware = require("../middlewares/apiKeyMiddleware.js");



const router=express.Router();     


const {userauthenticate}=require("../middlewares/userauthenticate.js");
const { getMasterAccountsController } = require("../controllers/CopierController.js");
 router.use(userauthenticate);


 router.get("/logger-info", userInfoController);
 router.get('/get-all-masters', apiKeyMiddleware, getMasterAccountsController);

// const authenticate=require("../middlewares/authenticate.js");

// router.use(authenticate("client"));


// router.post("/signup", apiKeyMiddleware, registerUserController);   
// router.post("/signup/:id", apiKeyMiddleware, registerUserController);

// router.post("/login",  apiKeyMiddleware, loginUserController); 

//...************User Routes *******************************************



                                                                        //cookies mein check referesh token 


router.get("/get-users", apiKeyMiddleware, getUsersController);  
router.get("/get-user", apiKeyMiddleware, getUserByIdController);

// router.get("/forgot-password", apiKeyMiddleware, getUserByEmailController);

router.post("/custom-mail", apiKeyMiddleware, sendCutomMailController);
// router.post("/send-link", apiKeyMiddleware,sendVerificationLinkController);
// router.post("/verify-link",apiKeyMiddleware, verifyEmailController);

router.get("/get-account-types", apiKeyMiddleware, getAllAccountTypeController);  //log out  




router.get("/get-platforms", apiKeyMiddleware, getPlatformsController);

router.get(
  "/get-payment-methods",
  apiKeyMiddleware,
  getpaymentMethodsController  //getpaymentmethods
);

// router.post("/custom-mail", apiKeyMiddleware, sendCutomMailController);


router.post("/logout",apiKeyMiddleware,clientlogOutUserController);

router.put("/update-user", apiKeyMiddleware, updateUserController);
  
router.put(
  "/:userId/wallet-details",
  apiKeyMiddleware,
  addOrUpdateWalletDetails
);
router.put("/:userId/bank-details", apiKeyMiddleware,addOrUpdateBankDetails);
router.put("/:userId/kyc-details", apiKeyMiddleware,addOrUpdateKycDetails);
router.put(   
  "/:userId/kyc-status",apiKeyMiddleware,
  updateKycStatusController,
  addOrUpdateKycDetails
);
// router.post("/send-reset-link", apiKeyMiddleware,sendForgotPasswordController);
// router.post(
//   "/reset-password/:token",apiKeyMiddleware,
//   resetPasswordController
// );

router.post(
  "/create-mt5-account/:userId",apiKeyMiddleware,
  addMt5AccountController
);


router.post(
  "/add-referral-withdrawal",
  apiKeyMiddleware,
  addReferralWithrawalController
);
 router.post("/update-password",apiKeyMiddleware, updatePasswordController);

router.post("/deposit",  apiKeyMiddleware,  addDepositController);

router.get("/deposit/:userId", apiKeyMiddleware, getDepositDataByIdController);
router.get("/transfer-records",apiKeyMiddleware, getTransferRecordsController);


router.post("/withdrawal", apiKeyMiddleware,withdrawalController);

router.get(
  "/withdrawals",
  apiKeyMiddleware,
  getWithdrawalByIdController
);


router.get(
  "/get-all-notification/:userId",
  apiKeyMiddleware,
  user_getAllNotifications  
);

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

router.get("/site-config", apiKeyMiddleware, getSiteConfigController);  

router.get("/get-toogle", apiKeyMiddleware, getToggleController);

router.post("/send-otp", apiKeyMiddleware, sendOtpController);
router.post("/verify-otp", apiKeyMiddleware, verifyOtpController);

router.get(
  "/ib-withdrawals",
  apiKeyMiddleware,
  getIbWithdrawalByIdController
);
router.get("/logs", apiKeyMiddleware, getAllLogController);
router.get("/log/:id", apiKeyMiddleware, getLogByIdController);

router.get(
  "/get-payment-methods",
  apiKeyMiddleware,
  getpaymentMethodsController  
);

module.exports=router;



























