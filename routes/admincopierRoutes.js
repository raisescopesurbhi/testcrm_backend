const express=require("express");

const {adminCopierController,adminDeleteController,adminDeleteAllController}=require("../controllers/adminCopierController");

const apiKeyMiddleware=require("../middlewares/apiKeyMiddleware.js");


const router=express.Router();

const {adminauthenticate}=require("../middlewares/adminauthenticate.js");
 router.use(adminauthenticate);


 router.get("/all-copiers", apiKeyMiddleware, adminCopierController);
 router.delete("/delete-copier",apiKeyMiddleware,adminDeleteController);
 router.delete("/delete-all-copiers",apiKeyMiddleware,adminDeleteAllController);

 module.exports=router;