const copy = require("../models/copier");
const UserModel = require("../models/user/userModel");
const { checkIfMasterExists } = require("../services/CopierService");
const {
  createNewMaster,
  updateExistingMaster,
} = require("../services/CopierService");
const { copyClient } = require("../services/metaClient");

const { getOpenTradesByAccount } = require("../services/CopierService");
const { getCloseTradeAllUsers } = require("../services/CopierService");

const createMasterController = async (req, res) => {
  try {
    const {
      nickname,
      accountNumber,
      commission,
      minimumInvestment,
      publicChatLink,
      strategyDescription,
    } = req.body;

    console.log("nickanme", nickname);

    if (
      !nickname ||
      !accountNumber ||
      commission === undefined ||
      minimumInvestment === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide nickname, account number, commission, and minimum investment",
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

    // const user = await UserModel.findById();

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
    //   (acc) => String(acc.accountNumber) === String(accountNumber)
    // );

    // console.log("accounts",account);

    // if (!account) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Account not found or does not belong to you",
    //   });
    // }

    const checkExistingResponse = await checkIfMasterExists(accountNumber);
    console.log("checkExistingResponse", checkExistingResponse);

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

// async function createNewMaster(req, res, account, masterData) {
//     const { nickname, commission, minimumInvestment, publicChatLink, strategyDescription } = masterData;

//     try {
//         // Step 1: Get copy manager ID
//         const checkResult = await checkIfMasterExists(account.accountNumber);
//         const copyManagerId = checkResult.copyManagerId;

//         if (!copyManagerId) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Failed to get copy manager ID from external API'
//             });
//         }

//         console.log('Got copyManagerId:', copyManagerId);

//         // Step 2: Add master account
//         const formData = new FormData();
//         formData.append('userId', copyManagerId.toString());
//         formData.append('mt5Account', account.accountNumber.toString());

//         const api2Response = await copyClient.post(`${process.env.COPY_API_URL}/api/addMasterAccount`, formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data'
//             }
//         });

//         console.log('API 2 Response:', api2Response.data);
//         console.log('API 2 Status:', api2Response.status);

//         if (api2Response.data.error) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Failed to add master account on external API'
//             });
//         }

//         // Step 3: Update master commission
//         const api3Response = await copyClient.post(`${process.env.COPY_API_URL}/api/updateMasterCommission`, {
//             masterAccount: parseInt(account.mt5Account),
//             commission: commission,
//             nickname: nickname,
//             min_invest: minimumInvestment,
//             description: strategyDescription || '',
//             chat_link: publicChatLink || ''
//         });

//         console.log('API 3 Response:', api3Response.data);

//         if (!api3Response.data.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Failed to update master commission on external API'
//             });
//         }

//         // All APIs successful, now create in database
//         // First, find or create Copy record
//         // let copyRecord = await Copy.findOne({
//         //     user: req.user.id,
//         //     accounts: account._id,
//         //     copyType: 'Master'
//         // });

//         // if (!copyRecord) {
//         //     copyRecord = await Copy.create({
//         //         user: req.user.id,
//         //         accounts: [account._id],
//         //         copyType: 'Master',
//         //         status: 'accepted'
//         //     });
//         // }

//         // All APIs successful, return success response
//         res.status(201).json({
//             success: true,
//             message: 'Master created successfully',
//             data: {
//                 mt5Account: account.mt5Account,
//                 nickname,
//                 commission,
//                 minimumInvestment,
//                 publicChatLink: publicChatLink || '',
//                 strategyDescription: strategyDescription || '',
//                 copyManagerId: copyManagerId
//             }
//         });

//     } catch (apiError) {
//         console.error('External API Error:', apiError);

//         // Check if we can still get copyManagerId from error response
//         const copyManagerId = apiError.response?.data?.copyManagerId;

//         if (copyManagerId) {
//             console.log('Got copyManagerId from error response:', copyManagerId);

//             try {
//                 // Continue with API 2 and 3 using the copyManagerId from error response
//                 const formData = new FormData();
//                 formData.append('userId', copyManagerId.toString());
//                 formData.append('mt5Account', account.mt5Account.toString());

//                 const api2Response = await axios.post(`${process.env.COPY_API_URL}/api/addMasterAccount`, formData, {
//                     headers: {
//                         'Content-Type': 'multipart/form-data'
//                     }
//                 });

//                 console.log('Retry API 2 Response:', api2Response.data);

//                 if (api2Response.data.error) {
//                     return res.status(400).json({
//                         success: false,
//                         message: 'Failed to add master account on external API'
//                     });
//                 }

//                 // API 3: Update master commission
//                 const api3Response = await axios.post(`${process.env.COPY_API_URL}/api/updateMasterCommission`, {
//                     masterAccount: parseInt(account.mt5Account),
//                     commission: commission,
//                     nickname: nickname,
//                     min_invest: minimumInvestment,
//                     description: strategyDescription || '',
//                     chat_link: publicChatLink || ''
//                 });

//                 if (!api3Response.data.success) {
//                     return res.status(400).json({
//                         success: false,
//                         message: 'Failed to update master commission on external API'
//                     });
//                 }

//                 res.status(201).json({
//                     success: true,
//                     message: 'Master created successfully',
//                     data: {
//                         mt5Account: account.mt5Account,
//                         nickname,
//                         commission,
//                         minimumInvestment,
//                         publicChatLink: publicChatLink || '',
//                         strategyDescription: strategyDescription || '',
//                         copyManagerId: copyManagerId
//                     }
//                 });

//             } catch (secondError) {
//                 console.error('Error in secondary flow:', secondError);
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Error in secondary processing: ' + secondError.message
//                 });
//             }
//         } else {
//             // No copyManagerId available, return error
//             return res.status(500).json({
//                 success: false,
//                 message: 'Error communicating with external APIs and no copyManagerId available: ' + (apiError.response?.data?.message || apiError.message)
//             });
//         }
//     }
// }

const updateMasterAccountByIdController = async (req, res) => {
  try {
    const { id } = req.params; // account number
    const {
      nickname,
      commission,
      minimumInvestment,
      publicChatLink,
      strategyDescription,
    } = req.body;

    console.log("Update Master Request:", req.body, "ID:", id);

    if (
      !nickname ||
      commission === undefined ||
      minimumInvestment === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide nickname, commission, and minimum investment",
      });
    }

    if (commission < 0 || commission > 50) {
      return res.status(400).json({
        success: false,
        message: "Commission must be between 0% and 50%",
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
        message: "Master account not found",
      });
    }

    return await updateExistingMaster(req, res, id, {
      nickname,
      commission,
      minimumInvestment,
      publicChatLink,
      strategyDescription,
    });
  } catch (error) {
    console.error("Update master error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating master",
    });
  }
};

const deleteMasterController = async (req, res) => {
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
        },
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
        apiError.response?.data || apiError.message,
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

// const getMasterAccountIdController = async (req, res) => {
//     try {
//         // Use the ID from params as the MT5Account number
//         // console.log('Get master request for ID:', req.params.id);

//         const response = await copyClient.get(`/api/getMasterDetailsByAccount?MT5Account=${id}`
//         );

//         console.log('Get master response:', response.data);

//         if (!response.data.success) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Master not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: response.data.data,
//             message:"Run successfully",
//         });
//     } catch (error) {
//         console.error('Get master error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error while fetching master',
//             error:error.message
//         });
//     }
// };

// const getMasterAccountIdController = async (req, res) => {
//   try {
//     const { id } = req.query;
//     console.log("id", id);

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Id not found",
//       });
//     }

//     const response = await copyClient.get(
//       `/api/getMasterDetailsByAccount?MT5Account=${encodeURIComponent(id)}`
//     );

//     console.log("Get master response:", response.data);

//     if (!response.data.success) {
//       return res.status(404).json({
//         success: false,
//         message: "Master not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: response.data.data,
//       message: "Run successfully",
//     });
//   } catch (error) {
//     console.error("Get master error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching master",
//       error: error.message,
//     });
//   }
// };

const getMasterAccountsController = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    const newArray = user.accounts.map((ele) => String(ele.accountNumber));

    const externalResponse = await copyClient.post(
      `/api/getMasterDetailsByAccounts`,
      {
        userId: parseInt(process.env.User_Id),
        masterAccounts: newArray,
      },
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

const setupCopyingController = async (req, res) => {
  try {
    const { masterAccount, copierAccount, minInvestment } = req.body;

    console.log("masterAccount", masterAccount);

    // Validate required fields
    if (!masterAccount || !copierAccount || !minInvestment) {
      return res.status(400).json({
        success: false,
        message:
          "Master account, copier account, and minimum investment are required",
      });
    }

    // Prepare form data for external API
    const formData = new FormData();
    formData.append("userId", process.env.User_Id);
    formData.append("mt5Account", copierAccount);
    formData.append("masterAccount", masterAccount);
    formData.append("min_invest", minInvestment.toString());

    // Call external API to setup copying
    const response = await copyClient.post(
      `/api/addAccountToMasterByCheckingBalance`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    // Check if external API returned error
    if (response.data.error) {
      return res.status(400).json({
        success: false,
        message: response.data.message || "Failed to setup copying",
      });
    }

    res.status(200).json({
      success: true,
      message: response.data.message || "Successfully set up copying",
    });
  } catch (error) {
    console.error("Error setting up copying:", error);

    // Handle external API errors
    if (error.response && error.response.data) {
      return res.status(400).json({
        success: false,
        message: error.response.data.message || "Failed to setup copying",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMasterDetailsController = async (req, res) => {
  try {
    const { masterId } = req.params;

    const response = await copyClient.get(`/api/getMasterDetailsByAccount`, {
      params: {
        MT5Account: masterId,
      },
    });

    if (!response.data.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch master details",
      });
    }

    // const masterData = response.data.data;
    // const riskScore = calculateRiskScore(masterData.stats.all.gain, masterData.stats.all.profit);
    // const expertise = getExpertiseLevel(masterData.stats.all.gain, masterData.stats.all.copierCount, masterData.stats.all.profit);

    // // Transform API data to match frontend structure
    // const transformedMaster = {
    //     id: masterData.login.toString(),
    //     name: masterData.name,
    //     avatar: getAvatar(masterData.name),
    //     expertise: expertise,
    //     riskScore: riskScore,
    //     growth: `${masterData.stats.all.gain.toFixed(2)}%`,
    //     profitLoss: Math.round(masterData.stats.all.profit),
    //     copiers: masterData.stats.all.copierCount,
    //     fees: masterData.commission === 0 ? 'FREE' : `${masterData.commission}%`,
    //     capital: masterData.balance > 0 ? masterData.balance.toLocaleString() : '0',
    //     minInvestment: masterData.min_invest || 100,
    //     activeSince: new Date(masterData.created_at).toLocaleDateString('en-US', {
    //         month: 'short',
    //         year: 'numeric'
    //     }),
    //     description: masterData.description || 'No description available',
    //     telegramLink: masterData.chat_link || null,

    //     // Performance data for different periods
    //     performance: {
    //         profit: `${masterData.stats.all.gain.toFixed(2)}%`,
    //         copier: masterData.stats.all.copierCount,
    //         profitAndLoss: Math.round(masterData.stats.all.profit).toLocaleString()
    //     },

    //     // Account details
    //     accountDetails: {
    //         unrealizedProfit: Math.round(masterData.floating_profit || 0),
    //         accountBalance: Math.round(masterData.balance || 0).toLocaleString(),
    //         masterTraderBonus: '0', // Not provided in API
    //         lever: '100' // Default leverage, not provided in API
    //     },

    //     // Risk management (dummy data since not provided in API)
    //     riskManagement: {
    //         maxUnrealizedLoss: 5000,
    //         maxLossDuration: '7 days'
    //     },

    //     // Activity data for chart (dummy data - you may need another API for this)
    //     activityData: {
    //         '1W': generateDummyActivityData(7),
    //         '1M': generateDummyActivityData(30),
    //         '3M': generateDummyActivityData(90),
    //         '6M': generateDummyActivityData(180),
    //         'ALL': generateDummyActivityData(365)
    //     },

    //     // Trades (dummy data - you may need another API for this)
    //     trades: [
    //         {
    //             id: 'T001',
    //             symbol: 'EURUSD',
    //             type: 'buy',
    //             openTime: new Date().toISOString(),
    //             closeTime: new Date().toISOString(),
    //             duration: '2h 15m',
    //             profit: Math.random() * 200 - 100
    //         }
    //     ],

    //     // Stats for different periods
    //     stats: {
    //         weekly: masterData.stats.weekly,
    //         monthly: masterData.stats.monthly,
    //         threeMonths: masterData.stats.three_months,
    //         sixMonths: masterData.stats.six_months,
    //         all: masterData.stats.all
    //     }
    // };

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching master details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getTradeHistoryController = async (req, res) => {
  try {
    const { copierAccounts, page = 1, pageSize = 10 } = req.body;

    if (!copierAccounts || !Array.isArray(copierAccounts)) {
      return res.status(400).json({
        success: false,
        message: "Copier accounts are required",
      });
    }

    const response = await copyClient.post(
      `/api/getCopiersTradeHistoryByAccountsByPage`,
      {
        copierAccounts: copierAccounts,
        page: parseInt(page),
        page_size: parseInt(pageSize),
      },
    );

    if (!response.data.error) {
      return res.status(200).json({
        success: true,
        data: response.data,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to fetch trade history",
    });
  } catch (error) {
    console.error("Error fetching trade history:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// If external API deletion was successful, update local database
// try {
//     // Find and update Copy record
//     const copyRecord = await Copy.findOne({
//         accounts: account._id,
//         copyType: 'Master',
//         status: 'accepted'
//     });

//     if (copyRecord) {
//         // Remove the account from the Copy record or set status to inactive
//         if (copyRecord.accounts.length === 1) {
//             // If this is the only account, set status to inactive
//             copyRecord.status = 'inactive';
//         } else {
//             // If there are multiple accounts, remove this one
//             copyRecord.accounts = copyRecord.accounts.filter(acc => !acc.equals(account._id));
//         }
//         await copyRecord.save();
//     }

// } catch (dbError) {
//     console.error('Database update error after API deletion:', dbError);
//     // Log the error but don't fail the request since external deletion succeeded
//     console.warn('Master deleted from external API but local database update failed');
// }

// res.status(200).json({
//     success: true,
//     message: 'Master account deleted successfully'
// });

// } catch (error) {
//     console.error('Delete master error:', error);
//     res.status(500).json({
//         success: false,
//         message: 'Server error while deleting master'
//     });
// }

const getOpenTradeServiceController = async (req, res) => {
  try {
    const { mt5Account } = req.params;
    console.log(mt5Account);
    const data = await getOpenTradesByAccount(mt5Account);
    console.log("data", data);
    return res.status(200).json({ ok: true, data: data });
  } catch (e) {
    console.log("error", e);
    return res
      .status(500)
      .json({ ok: false, message: e.message || "Meta error" });
  }
};

const getCloseTradeServiceController = async (req, res) => {
  try {
    const { Manager_Index, StartTime, EndTime } = req.query;

    //         const manager_Index=Manager_Index;

    //             const startTime = StartTime||"2021-07-20 00:00:00";
    // const endTime =
    //       EndTime || `${new Date().toISOString().slice(0,10)} 23:59:59`;

    const data = await getCloseTradeAllUsers(Manager_Index, StartTime, EndTime);
    // console.log("data",data);
    return res.status(200).json({ ok: true, data: data });
  } catch (e) {
    console.log("error", e);
    return res
      .status(500)
      .json({ ok: false, message: e.message || "Meta error" });
  }
};

const getAllCopiersController = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const masterAccounts = (user.accounts || []).map((ele) =>
      String(ele.accountNumber),
    );

    const externalResponse = await copyClient.post(
      `/api/getMasterDetailsByAccounts`,
      {
        userId: parseInt(process.env.User_Id),
        masterAccounts,
      },
    );

    const allMasters = Array.isArray(externalResponse?.data?.masterAccountsData)
      ? externalResponse.data.masterAccountsData
      : [];

    const allCopiers = allMasters.flatMap((item) => {
      const master = item?.master || {};
      const copiers = Array.isArray(item?.copiers) ? item.copiers : [];

      return copiers.map((copier, index) => ({
        id: Number(copier?.MT5Account || index + 1),
        accountNumber: String(copier?.MT5Account || ""),
        masterAccount: String(master?.MT5Account || ""),
        masterName: String(master?.name || ""),
        name: String(copier?.name || ""),
        balance: Number(copier?.balance || 0),
        equity: Number(copier?.equity || 0),
        totalTrades: Number(copier?.totalTrades || 0),
        profit: Number(copier?.totalProfit || 0),
        commissionPaid: Number(copier?.totalMasterCommission || 0),
        gain: Number(copier?.gain || 0),
        joinedDate: copier?.created_at
          ? String(copier.created_at).slice(0, 10)
          : "",
      }));
    });

    return res.status(200).json({
      success: true,
      message: "All copiers fetched successfully",
      data: allCopiers,
    });
  } catch (error) {
    console.error(
      "getAllCopiersController error:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching all copiers",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  createMasterController,
  updateMasterAccountByIdController,
  deleteMasterController,
  getMasterAccountsController,
  setupCopyingController,
  getMasterDetailsController,
  getTradeHistoryController,
  getOpenTradeServiceController,
  getCloseTradeServiceController,
  getAllCopiersController,
};
