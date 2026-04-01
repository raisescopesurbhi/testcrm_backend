const express = require("express");

const {getKycUsersController, sendCustomMailAllUsers}=require("../controllers/UserController.js");

const {getDepositDataController}=require("../controllers/depositController.js");  

const {getWithdrawalDataController}=require("../controllers/withdrwalController.js");

const {getWithdrawalByIdController}=require("../controllers/withdrwalController.js");   


const {getIbWithdrawalByIdController}=require("../controllers/referalWithdrawalController.js");  

const {adminLoginController}=require("../controllers/adminUserController.js");


const {getReferralWithrawal}=require("../controllers/referalWithdrawalController.js");


const {addPaymentMethodController,getpaymentMethodsController,updatePaymentMethodController,deletePaymentMethodController}=require("../controllers/paymentMethodController.js");


const {getCustomGroupsController}=require("../controllers/CustomGroupController.js");

const {getUsersListController}=require("../controllers/UserController.js");

const {admin_getAllNotifications}=require("../controllers/notificationController.js");


const {getSiteConfigController}=require("../controllers/siteConfigController.js");
 

const {getUserStatsController}=require("../controllers/ReportController.js");

const {getDepositStatsController}=require("../controllers/ReportController.js");

const {getWithdrawalStatsController}=require("../controllers/ReportController.js");

const apiKeyMiddleware=require("../middlewares/apiKeyMiddleware.js");  

const {getIBWithdrawalsStatsController}=require("../controllers/ReportController.js");


const {sendCutomMailController}=require("../controllers/UserController.js");

const {withdrawIBBalanceController,updateUserController}=require("../controllers/UserController.js");

const {updateReferralWithrawalController}=require("../controllers/referalWithdrawalController.js");


const {updateDepositDataController}=require("../controllers/depositController.js");

const {updateWithdrawalDataController}=require("../controllers/withdrwalController.js");

const {getUserByIdController,
  getUsersController,
  addOrUpdateWalletDetails,
  addOrUpdateBankDetails,
  addOrUpdateKycDetails,
  adminlogOutUserController,
  getAdminUserByIdController,

    updateKycStatusController,

    UserLoginByAdminController,
    getMasterAccountsController,
  
} = require("../controllers/UserController.js");

const {
  addAdminIbController,
  getAdminIbController,
  updateAdminIbController,
  addLevelController,
} = require("../controllers/adminIbController.js");

const {getTotalCustomMailCountController}=require("../controllers/getTotalCustomMailController.js")








const router=express.Router();
   
  








//********************************************************AdminROUTES*********************************************
// 




 const {adminauthenticate}=require("../middlewares/adminauthenticate.js");
 router.use(adminauthenticate);




// router.use(authenticate);

// const {authenticate}=require("../middlewares/superadminauthenticate.js");
// router.use(authenticate);


router.post("/logout",apiKeyMiddleware,adminlogOutUserController);
router.put("/:userId/bank-details",apiKeyMiddleware,addOrUpdateBankDetails);

router.get("/kyc-users", apiKeyMiddleware, getKycUsersController);

router.get("/deposits", apiKeyMiddleware, getDepositDataController);

router.get("/admin-ibs", apiKeyMiddleware, getAdminIbController);

router.post("/add-admin-ib", apiKeyMiddleware, addAdminIbController);

router.put("/update-admin-ib/:id", apiKeyMiddleware, updateAdminIbController);
router.post("/admin-login-user/:id",apiKeyMiddleware,UserLoginByAdminController);
router.get("/get-all-masters",apiKeyMiddleware,getMasterAccountsController);



router.get("/withdrawals", apiKeyMiddleware, getWithdrawalDataController);
router.get(
  "/withdrawals/:userId",
  apiKeyMiddleware,
  getWithdrawalByIdController
);

// router.get(
//   "/get-all-notification/:userId",
//   apiKeyMiddleware,
//   user_getAllNotifications  
// );
router.get(
  "/ib-withdrawals/:id",
  apiKeyMiddleware,
  getIbWithdrawalByIdController
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


router.get("/get-custom-groups", apiKeyMiddleware, getCustomGroupsController);  

//  router.post("/login", apiKeyMiddleware, adminLoginController);

router.get("/user-list", apiKeyMiddleware, getUsersListController);


router.put("/update-deposit", apiKeyMiddleware, updateDepositDataController);


router.get(
  "/get-all-notification/:userId",
  apiKeyMiddleware,
  admin_getAllNotifications
);


router.get("/referral-withdrawals", apiKeyMiddleware, getReferralWithrawal);
router.get(
  "/ib-withdrawals/:id",
  apiKeyMiddleware,
  getIbWithdrawalByIdController
);


router.post("/add-level",apiKeyMiddleware, addLevelController);

 
// router.get("/site-config", apiKeyMiddleware, getSiteConfigController);  
router.put("/update-user", apiKeyMiddleware, updateUserController);  

router.put(
  "/update-referral-withdrawal",
  apiKeyMiddleware,
  updateReferralWithrawalController
);



router.get("/user-report", apiKeyMiddleware, getUserStatsController);
router.get("/deposit-report", apiKeyMiddleware, getDepositStatsController);
router.get(
  "/withdrawal-report",
  apiKeyMiddleware,
  getWithdrawalStatsController
);


router.put(   
  "/user/:userId/kyc-status",apiKeyMiddleware,
  updateKycStatusController,
  addOrUpdateKycDetails
);


router.get("/get-users", apiKeyMiddleware, getUsersController);  

router.post("/custom-mail", apiKeyMiddleware, sendCutomMailController);
router.post("/custom-mail/all-users",apiKeyMiddleware,sendCustomMailAllUsers);
router.get(
  "/ib-withdrawal-report",
  apiKeyMiddleware,
  getIBWithdrawalsStatsController
);
router.post("/withdraw-ib-balance", withdrawIBBalanceController);

router.put(
  "/update-withdrawal",  
  apiKeyMiddleware,
  updateWithdrawalDataController
);
router.get("/get-user-id", apiKeyMiddleware, getAdminUserByIdController);
router.get("/get-user", apiKeyMiddleware, getUserByIdController);
router.get("/total-mail-count",apiKeyMiddleware,getTotalCustomMailCountController);

module.exports=router;