const express= require("express");

const {
  addPlatformController,
  getPlatformsController,
  updatePlatformController,
  deletePlatformController,
} = require("../controllers/accountControllers.js");



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


const{
  superadminlogOutUserController,
  sAdminLoginAdminController
  } =require("../controllers/UserController.js");

const {
  getSiteConfigController,
  updateSiteConfigController,
} = require("../controllers/siteConfigController.js");


const {
  addToggleController,
  getToggleController,      
  updateToggleController,
  deleteToggleController,
} = require("../controllers/ToggleController.js");   

const { verifySAdminPassword } = require("../controllers/sAdminController.js");


const {
  createOrUpdateAdmin,
  adminGetUserController,
} = require("../controllers/adminUserController.js");
const apiKeyMiddleware = require("../middlewares/apiKeyMiddleware.js");


const router=express.Router();

const {superadminauthenticate}=require("../middlewares/superadminauthenticate.js");


router.use(superadminauthenticate);

//***********************SuperadminRoutes******************** */

router.post("/add-platform", addPlatformController);
router.get("/get-platforms",  getPlatformsController);
router.put("/update-platform",  updatePlatformController);
router.delete("/delete-platform", deletePlatformController);


router.post("/logout",apiKeyMiddleware,superadminlogOutUserController);



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



router.post("/admin/create-n-update", apiKeyMiddleware, createOrUpdateAdmin);
router.get("/admin/user", apiKeyMiddleware, adminGetUserController);


router.get("/site-config", apiKeyMiddleware, getSiteConfigController);  
router.put("/site-config", apiKeyMiddleware, updateSiteConfigController);

router.post("/add-toggle", apiKeyMiddleware, addToggleController);

router.get("/get-toogle", apiKeyMiddleware, getToggleController);

router.post("/s-admin-login-admin",apiKeyMiddleware,sAdminLoginAdminController);





router.put("/update-toogle/:id", apiKeyMiddleware, updateToggleController);
   


router.delete("/delete-toogle/:id", apiKeyMiddleware, deleteToggleController);


router.post("/s-admin-login", verifySAdminPassword);

module.exports=router;