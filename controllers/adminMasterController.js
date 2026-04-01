const {checkIfMasterExists}=require("../services/CopierService");
const {createNewMaster} =require("../services/CopierService");
const {updateExistingMaster}=require("../services/CopierService");
const UserModel=require("../models/user/userModel");
const {copyClient}=require("../services/metaClient");
const admincreateMasterController = async (req, res) => {
  try {
    const {
      nickname,
      accountNumber,
      commission,
      minimumInvestment,
      publicChatLink,
      strategyDescription,
    } = req.body;
    

    console.log("nickanme",nickname);




    if (
      !nickname ||
      !accountNumber ||
      commission === undefined ||
      minimumInvestment === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide nickname, account number, commission, and minimum investment",
      });
    }

    const parsedCommission = Number(commission);
    const parsedMinimumInvestment = Number(minimumInvestment);

    if (isNaN(parsedCommission) || isNaN(parsedMinimumInvestment)) {
      return res.status(400).json({
        success: false,
        message: "Commission and minimum investment must be valid numbers",
      });
    }

    if (parsedCommission < 0 || parsedCommission > 50) {
      return res.status(400).json({
        success: false,
        message: "Commission must be between 0 and 50",
      });
    }

    const checkExistingResponse = await checkIfMasterExists(accountNumber);
        console.log("checkExistingResponse",checkExistingResponse);
    
        if (checkExistingResponse?.exists) {
          return res.status(400).json({
            success: false,
            message: "Master account already exists",
          });
        }
    
        return await createNewMaster(req, res, accountNumber, {
          nickname,
          commission: parsedCommission,
          minimumInvestment: parsedMinimumInvestment,
          publicChatLink: publicChatLink || "",
          strategyDescription: strategyDescription || "",
          // userId: user._id,
          // userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          // userEmail: user.email || "",
        });
      } catch (error) {
        console.error("Create master error:", error);
        return res.status(500).json({
          success: false,
          message: "Server error while creating master",
          error: error.message,
        });
      }
    };

    const adminupdateMasterAccountByIdController = async (req, res) => {
      try {
        const { id } = req.params; // account number
        const {
          nickname,
          commission,
          minimumInvestment,
          publicChatLink,
          strategyDescription
        } = req.body;
    
        console.log('Update Master Request:', req.body, 'ID:', id);
    
        if (!nickname || commission === undefined || minimumInvestment === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Please provide nickname, commission, and minimum investment'
          });
        }
    
        if (commission < 0 || commission > 50) {
          return res.status(400).json({
            success: false,
            message: 'Commission must be between 0% and 50%'
          });
        }
    
        // const user=await UserModel.findOne(req.user.id);
    
        // const account = user.accounts.find(
        //   (acc) => String(acc.accountNumber) === String(id)
        // );
    
    
    
    
        // if (req.user.role === 'adminusers') {
        //   // Admin: search any user having this account number in accounts array
        //   userDoc = await UserModel.findOne({
        //     'accounts.accountNumber': id
        //   });
    
        //   if (!userDoc) {
        //     return res.status(404).json({
        //       success: false,
        //       message: 'Account not found'
        //     });
        //   }
        // } else {
        //   // Normal user: search only logged-in user's document
        //   userDoc = await UserModel.findOne({
        //     _id: req.user.id,
        //     'accounts.accountNumber': id
        //   });
    
        //   if (!userDoc) {
        //     return res.status(404).json({
        //       success: false,
        //       message: 'Account not found or does not belong to you'
        //     });
        //   }
        // }
    
        // // Extract matched account object from embedded accounts array
        // account = userDoc.accounts.find(
        //   (acc) => String(acc.accountNumber) === String(id)
        // );
    
        // if (!account) {
        //   return res.status(404).json({
        //     success: false,
        //     message: 'Account not found in user accounts'
        //   });
        // }
    
        // External API master existence check
        const checkExistingResponse = await checkIfMasterExists(id);
    
        if (!checkExistingResponse.exists) {
          return res.status(404).json({
            success: false,
            message: 'Master account not found'
          });
        }
    
        return await updateExistingMaster(req, res, id, {
          nickname,
          commission,
          minimumInvestment,
          publicChatLink,
          strategyDescription
        });
    
      } catch (error) {
        console.error('Update master error:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error while updating master'
        });
      }
    };
    

    const deleteAdminMasterController = async (req, res) => {
      try {
        const { id } = req.params; // This should be the MT5 account number
    
        // Find account by MT5 account number to verify ownership
        // const user = await UserModel.findById(req.user.id);
    
        // if (!user) {
        //   return res.status(404).json({
        //     success: false,
        //     message: "User not found",
        //   });
        // }
    
        // if (!user.accounts || user.accounts.length === 0) {
        //   return res.status(404).json({
        //     success: false,
        //     message: "No accounts found for this user",
        //   });
        // }
    
        // const account = user.accounts.find(
        //   (acc) => String(acc.accountNumber) === String(id)
        // );
    
        // console.log("accounts", account);
    
        // if (!account) {
        //   return res.status(404).json({
        //     success: false,
        //     message: "Account not found or does not belong to you",
        //   });
        // }
    
        // Check if master exists in external API
        const checkExistingResponse = await checkIfMasterExists(id);
    
        if (!checkExistingResponse.exists) {
          return res.status(404).json({
            success: false,
            message: "Master account not found",
          });
        }
    
        // Check if master has active copiers by calling external API
        // try {
        //   const masterDetailsResponse = await axios.post(
        //     `${process.env.COPY_API_URL}/api/getMasterDetailsByAccounts`,
        //     {
        //       userId: parseInt(process.env.User_Id),
        //       masterAccounts: [parseInt(account.accountNumber)],
        //     }
        //   );
        //
        //   if (
        //     masterDetailsResponse.data.masterAccountsData &&
        //     masterDetailsResponse.data.masterAccountsData.length > 0
        //   ) {
        //     const masterData = masterDetailsResponse.data.masterAccountsData[0];
        //     const activeCopiers = masterData.copiers.filter(
        //       (copier) => copier.status === "active"
        //     );
        //
        //     if (activeCopiers.length > 0) {
        //       return res.status(400).json({
        //         success: false,
        //         message: `Cannot delete master with ${activeCopiers.length} active copiers. Please ensure all copiers disconnect first.`,
        //       });
        //     }
        //   }
        // } catch (error) {
        //   console.warn("Could not check copiers status:", error.message);
        //   // Continue with deletion even if we can't check copiers
        // }
    
        // Delete from external API
        try {
          const formData = new FormData();
          formData.append("masterccount", id.toString());
    
          const deleteResponse = await copyClient.post(
            `/api/deleteMasterAccount`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
    
          console.log("Delete API Response:", deleteResponse.data);
    
          if (deleteResponse.data.error) {
            return res.status(400).json({
              success: false,
              message: "Failed to delete master account from external API",
            });
          }
    
          return res.status(200).json({
            success: true,
            message: "Master account deleted successfully",
          });
        } catch (apiError) {
          console.error(
            "External API delete error:",
            apiError.response?.data || apiError.message
          );
    
          return res.status(500).json({
            success: false,
            message:
              "Error deleting master account from external API: " +
              (apiError.response?.data?.message || apiError.message),
          });
        }
      } catch (error) {
        console.error("Delete master controller error:", error);
        return res.status(500).json({
          success: false,
          message: "Server error while deleting master account",
        });
      }
    };

    const admingetMasterAccountsController = async (req, res) => {
      try {
        const user = await UserModel.find();
    
        // const newArray = user.accounts.map((ele)=>String(ele.accountNumber));

        const newArray = user.flatMap((u) =>
  (u.accounts || []).map((ele) => String(ele.accountNumber))
);
    
    
        const externalResponse = await copyClient.post(
          `/api/getMasterDetailsByAccounts`,
          {
            userId: parseInt(process.env.User_Id),
            masterAccounts : newArray
          }
        );
    
    
    
        return res.status(200).json({
          success: true,
          data: externalResponse.data.masterAccountsData || [],
          message: "masters listed successfully",
    // userq : newArray,
        });
      } catch (error) {
        console.error("Get masters error:", error.response?.data || error.message);
        return res.status(500).json({
          success: false,
          message: "Server error while fetching masters",
          error: error.response?.data || error.message,
        });
      }
    };

    const admingetAllAccountsController=async(req,res)=>{
        try{
        const userExist=await UserModel.find();
        
        const newArray= userExist.flatMap((u)=>
            (u.accounts||[]).map((ele)=>String(ele.accountNumber))
    );
    return res.status(200).json({message :"All Accounts fetched",
        User:newArray,
    })
}
catch(err){
    return res.status(500).json({message:"Server Errror",error:err.message});
}
    }


    module.exports={admincreateMasterController,adminupdateMasterAccountByIdController,deleteAdminMasterController,admingetMasterAccountsController,admingetAllAccountsController};

    


