import { copyClient, metaClient } from "./metaClient.js";

const MI = () => Number(process.env.MANAGER_INDEX);



export async function checkIfMasterExists(mt5Account) {
  try {
    const { data } = await copyClient.post(
      `/api/getAllMasterAndLinkedAccountsByManagerIndex`,
      {
        Manager_Index: MI(),
        accounts: [Number(mt5Account)],
      }
    );

    console.log("data is",data);
    const copyManagerId = data?.copyManagerId ?? null;
    const mastersData = data?.data?.mastersAndLinkedAccounts ?? [];

    const existingMaster = mastersData.find(
      (master) => Number(master?.masterAccount?.login) === Number(mt5Account)
    );

    return {
               exists: !!existingMaster,
      copyManagerId,
      masterData: existingMaster ?? null,
    };
  } catch (error) {
    console.log("error",error);
    return {
      exists: false,
      copyManagerId: error.response?.data?.copyManagerId ?? null,
      masterData: null,
    };
  }
}

export async function createNewMaster(req, res, account, masterData) {
    const { nickname, commission, minimumInvestment, publicChatLink, strategyDescription } = masterData;

    try {
        // Step 1: Get copy manager ID
        const checkResult = await checkIfMasterExists(account);
        console.log("checkResult",checkResult);
        const copyManagerId = checkResult.copyManagerId;

        if (!copyManagerId) {
            return res.status(400).json({
                success: false,
                message: 'Failed to get copy manager ID from external API'
            });
        }

        console.log('Got copyManagerId:', copyManagerId);

        // Step 2: Add master account
        const formData = new FormData();
        formData.append('userId', copyManagerId.toString());
        formData.append('mt5Account', account.toString());

        const api2Response = await copyClient.post(`/api/addMasterAccount`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('API 2 Response:', api2Response.data);
        console.log('API 2 Status:', api2Response.status);

        if (api2Response.data.error) {
            return res.status(400).json({
                success: false,
                message: 'Failed to add master account on external API'
            });
        }

        // Step 3: Update master commission
        const api3Response = await copyClient.post(`/api/updateMasterCommission`, {
            masterAccount: parseInt(account),
            commission: commission,
            nickname: nickname,
            min_invest: minimumInvestment,
            description: strategyDescription || '',
            chat_link: publicChatLink || ''
        });

        console.log('API 3 Response:', api3Response.data);

        if (!api3Response.data.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update master commission on external API'
            });
        }

        // All APIs successful, now create in database
        // First, find or create Copy record
        // let copyRecord = await Copy.findOne({
        //     user: req.user.id,
        //     accounts: account._id,
        //     copyType: 'Master'
        // });

        // if (!copyRecord) {
        //     copyRecord = await Copy.create({
        //         user: req.user.id,
        //         accounts: [account._id],
        //         copyType: 'Master',
        //         status: 'accepted'
        //     });
        // }

        // All APIs successful, return success response
        res.status(201).json({
            success: true,
            message: 'Master created successfully',
            data: {
                mt5Account: account,
                nickname,
                commission,
                minimumInvestment,
                publicChatLink: publicChatLink || '',
                strategyDescription: strategyDescription || '',
                copyManagerId: copyManagerId
            }
        });

    } catch (apiError) {
        console.error('External API Error:', apiError);

        // Check if we can still get copyManagerId from error response
        const copyManagerId = apiError.response?.data?.copyManagerId;

        if (copyManagerId) {
            console.log('Got copyManagerId from error response:', copyManagerId);

            try {
                // Continue with API 2 and 3 using the copyManagerId from error response
                const formData = new FormData();
                formData.append('userId', copyManagerId.toString());
                formData.append('mt5Account', account.accountNumber.toString());

                const api2Response = await copyClient.post(`/api/addMasterAccount`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                console.log('Retry API 2 Response:', api2Response.data);

                if (api2Response.data.error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to add master account on external API'
                    });
                }

                // API 3: Update master commission
                const api3Response = await copyClient.post(`/api/updateMasterCommission`, {
                    masterAccount: parseInt(account.accountNumber),
                    commission: commission,
                    nickname: nickname,
                    min_invest: minimumInvestment,
                    description: strategyDescription || '',
                    chat_link: publicChatLink || ''
                });

                if (!api3Response.data.success) {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to update master commission on external API'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Master created successfully',
                    data: {
                        mt5Account: accountNumber,
                        nickname,
                        commission,
                        minimumInvestment,
                        publicChatLink: publicChatLink || '',
                        strategyDescription: strategyDescription || '',
                        copyManagerId: copyManagerId
                    }
                });

            } catch (secondError) {
                console.error('Error in secondary flow:', secondError);
                return res.status(500).json({
                    success: false,
                    message: 'Error in secondary processing: ' + secondError.message
                });
            }
        } else {
            // No copyManagerId available, return error
            return res.status(500).json({
                success: false,
                message: 'Error communicating with external APIs and no copyManagerId available: ' + (apiError.response?.data?.message || apiError.message)
            });
        }
    }
}

export async function updateExistingMaster(req, res, id, masterData) {
    try {
        const { nickname, commission, minimumInvestment, publicChatLink, strategyDescription } = masterData;

        console.log('Updating existing master with data:', masterData);
        // Call API3 to update commission and details
        const api3Response = await copyClient.post(`/api/updateMasterCommission`, {
            masterAccount: parseInt(id),
            commission: commission,
            nickname: nickname,
            min_invest: minimumInvestment,
            description: strategyDescription || '',
            chat_link: publicChatLink || ''
        });

        console.log('API 3 Response:', api3Response.data);
        if (api3Response.data.success) {
            return res.status(200).json({
                success: true,
                message: 'Master updated successfully',
                data: {
                    mt5Account:id,
                    nickname,
                    commission,
                    minimumInvestment,
                    publicChatLink: publicChatLink || '',
                    strategyDescription: strategyDescription || ''
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to update master commission on external API'
            });
        }
    } catch (apiError) {
        console.error('API3 Error:', apiError.response?.data);
        return res.status(500).json({
            success: false,
            message: apiError.response?.data?.message || 'Error updating master commission on external API',error:apiError.message
        });
    }
}


export async function getOpenTradesByAccount(mt5Account) {
  const { data } = await metaClient.get(
    `/GetOpenTradeByAccount?Manager_Index=${encodeURIComponent(MI())}&MT5Accont=${encodeURIComponent(mt5Account)}`
  );

  console.log("border");
  return data;
}

export async function getCloseTradeAllUsers(Manager_Index,StartTime,EndTime) {
  console.log("starting Time is",StartTime);

  console.log("ending Time is",EndTime);
  // const { data } = await metaClient.get(
  //   `/GetCloseTradeAllUsers?Manager_Index=${encodeURIComponent(MI())} +
  //     &StartTime=${encodeURIComponent(startTime)} + 
  //     &EndTime=${encodeURIComponent(endTime)}`
  // );

  const { data } = await metaClient.get(
  `/GetCloseTradeAllUsers?Manager_Index=${Manager_Index}&StartTime=${encodeURIComponent(StartTime)}&EndTime=${encodeURIComponent(EndTime)}`
);

  return data;
}


















