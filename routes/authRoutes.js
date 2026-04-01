const express= require("express");


const apiKeyMiddleware = require("../middlewares/apiKeyMiddleware");


const {
  registerUserController,
  loginUserController,
  sendVerificationLinkController,
  verifyEmailController,
  getUserByEmailController,  
  sendForgotPasswordController,
  resetPasswordController,
  updatePasswordController,
  clientlogOutUserController,
  adminlogOutUserController,
  clientrefreshTokenController,
  adminrefreshTokenController,
  superadminlogOutUserController,
} = require("../controllers/UserController.js");

const {
  getSiteConfigController,
} = require("../controllers/siteConfigController.js");

const {adminLoginController}=require("../controllers/adminUserController.js");

const { verifySAdminPassword } = require("../controllers/sAdminController.js");

const router=express.Router();


//*******************************AuthRoutes*********** */

router.post("/signup", apiKeyMiddleware, registerUserController);   
router.post("/signup/:id", apiKeyMiddleware, registerUserController);
router.post("/client/login", apiKeyMiddleware, loginUserController);    //userRouter
// router.post("/client/logout",apiKeyMiddleware,clientlogOutUserController);
router.post("/client/refresh",apiKeyMiddleware,clientrefreshTokenController); //adminRouter
// router.post("/admin/logout",apiKeyMiddleware,adminlogOutUserController);
router.post("/admin/refresh",apiKeyMiddleware,adminrefreshTokenController);      //superadminRouter
// router.post("/s-admin/logout",apiKeyMiddleware,superadminlogOutUserController);



 

router.get("/forgot-password", apiKeyMiddleware, getUserByEmailController); 


router.post("/send-link", apiKeyMiddleware, sendVerificationLinkController);
router.post("/verify-link",apiKeyMiddleware , verifyEmailController);


router.post("/send-reset-link", apiKeyMiddleware,sendForgotPasswordController);
router.post(
  "/reset-password/:token",apiKeyMiddleware,
  resetPasswordController
);

router.post("/update-password",apiKeyMiddleware, updatePasswordController);

router.get("/site-config", apiKeyMiddleware, getSiteConfigController);  

router.post("/admin/login", apiKeyMiddleware, adminLoginController);

router.post("/s-admin-login", verifySAdminPassword);
// router.post("/s-admin-logout",logOutUserController);


module.exports=router;





















