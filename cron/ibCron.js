const adminIbModel = require("../models/user/adminIbModel");
const CloseTradeModel = require("../models/user/closedTradesModel");
const userIbListModel = require("../models/user/userIbListModel");
const UserModel = require("../models/user/userModel");
const { metaApi } = require("../utils/apiClients");

// const {backendApi} = require( "../utils/apiClients");
const cron = require("node-cron");

console.log("Running IB cron");

// Use lean() to return plain objects (reduces memory overhead)
async function getReferralAccount(referralFromId) {
  try {
    const user = await UserModel.findOne(
      { referralAccount: referralFromId },
      { referralFromId: 1 }
    ).lean();
    return user ? Number(user.referralFromId) : null;
  } catch (err) {
    console.error("Error fetching referralAccount:", err);
    return null;
  }
}

async function getReferralAccountsFromLower(user_referralAccount) {
  const referralAccounts = [];
  try {
    for (let level = 1; level <= 10; level++) {
      if (!user_referralAccount) break;
      referralAccounts.push({ [level]: user_referralAccount });
      user_referralAccount = await getReferralAccount(user_referralAccount);
    }
  } catch (err) {
    console.error("Error fetching referral accounts:", err);
  }
  return referralAccounts;
}

const getAllLevels = async (referralFromId) => {
  return referralFromId ? getReferralAccountsFromLower(referralFromId) : [];
};

// Cron job 1: Create IB user with level---
cron.schedule("*/20 * * * * *", async () => {
  try {
    // Use a cursor to stream users rather than loading all at once
    const cursor = await UserModel.find({ referralFromId: { $gt: 0 } }).lean();
    // console.log("cursor",cursor);
    for await (const user of cursor) {
      // Get all IB accounts for this user
      const ibAccounts = await getAllLevels(user.referralFromId);
      if (!ibAccounts.length) continue;
      
      // Get the account number from user.accounts if available
      let accountNumber = "000"; // Default value
      if (user.accounts && Array.isArray(user.accounts) && user.accounts.length > 0) {
        // Use the first account's number if available
        accountNumber = user.accounts[0].accountNumber || accountNumber;
      }
      
      for (const account of ibAccounts) {
        const key = Object.keys(account)[0];
        const value = account[key];
        const levelUser = await UserModel.findOne(
          { referralAccount: value },
          { referralAccount: 1 }
        ).lean();
        
        if (!levelUser) continue;
        
        const exists = await userIbListModel.exists({
          loggedUserReferralAccount: levelUser.referralAccount,
          email: user.email,
        });
        
        if (!exists) {
          await userIbListModel.create({
            loggedUserReferralAccount: levelUser.referralAccount,
            accountNumber: accountNumber, // Using the extracted account number
            level: key,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            country: user.country || "Unknown",
            email: user.email || "No Email Provided",
          });
        } else {
          // Update the existing document with the account number if it has changed
          await userIbListModel.findOneAndUpdate(
            {
              loggedUserReferralAccount: levelUser.referralAccount,
              email: user.email,
            },
            { accountNumber: accountNumber }
          );
        }
      }
    }
  } catch (error) {
    console.log("ERROR in create ib list ibAccounts", error);
  }
});

// Cron job 3: Save close trade to DB ----
cron.schedule("*/20 * * * * *", async () => {
  // console.log("restarted cron close trade to DB");
  console.log("error in close trade");
  try { 
        // Remove unique index from the 'ticket' field if it exists
        console.log("error");
        await CloseTradeModel.collection.dropIndex("ticket_1").then(() => {
          console.log("Unique index on ticket removed");
        }).catch((err) => {
          if (err.code === 27) {
            // console.log("Index 'ticket_1' does not exist, skipping removal.");
          } else {
            console.error("Error dropping index:", err);
          }
        });
    
         const formatDate = (date) => {
            const pad = (n) => (n < 10 ? '0' + n : n);
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
          };
          
          const last24Hours = new Date();
          last24Hours.setHours(last24Hours.getHours() - (30*24));
   
     const res = await metaApi.get(
        `GetCloseTradeAllUsers?Manager_Index=${process.env.MANAGER_INDEX}&StartTime=${formatDate(last24Hours)}&EndTime=2050-12-30 23:59:59`
      );


//     const res = await backendApi.get("/close-trades-all-users", {
//   params: {
//     startTime: formatDate(last24Hours), // must be "YYYY-MM-DD HH:mm:ss"
//     endTime: "2050-12-30 23:59:59",
//   },
// });

if (res.data?.ok) {
  console.log("Close Trades:", res.data);
} else {
  console.log("Error:", res.data?.message);
}

    for (const id of res.data) {
      
  
      const positionIdExist = await CloseTradeModel.exists({ positionId: id.PositionId });
    
      if (!positionIdExist) {
        await CloseTradeModel.create({
          mt5Account: id.MT5Account,
          lotSize: id.Lot,
          ticket: id.Ticket,
          closePrice: id.Close_Price,
          closeTime: id.Close_Time,
          openPrice: id.Open_Price,
          openTime: id.Open_Time,
          profit: id.Profit,
          symbol: id.Symbol,
          buySell: id.uPosStatus,
          positionId:id.PositionId
        });
        // console.log("close trade saved");
      }

  
    }
  } catch (error) {
    console.error("Error in save close trade to DB",error?.response?.data?.message || error?.response || error );
  }
});
// Cron job 4: Deposit bonus to referral ----


cron.schedule("*/20 * * * * *", async () => {
  try {
    // console.log("Starting IB commission processing...");
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    // Fetch qualifying trades with uncirculated commissions
    const trades = await CloseTradeModel.find({
      createdAt: { $gte: last24Hours },
      "commissions.isCalculated": { $ne: true },
    });

    // console.log(`Found ${trades.length} trades to process`);

    for (const trade of trades) {
      // Find user associated with the trade
      const user = await UserModel.findOne({ "accounts.accountNumber": trade.mt5Account }).lean();
      if (!user) {
        // console.log(`No user found for account: ${trade.mt5Account}, skipping...`);
        continue;
      }

      // Find the specific account from user's accounts
      const specificAccount = user.accounts.find((acc) => acc.accountNumber == trade.mt5Account);
      if (!specificAccount) {
        // console.log(`Account ${trade.mt5Account} not found in user ${user.email}'s accounts, skipping...`);
        continue;
      }

      // Get IB commission rules for this account type
      const adminIB = await adminIbModel.find({ accountType: specificAccount.accountType }).lean();

      // Get all referral levels for this user
      const ibAccounts = await getAllLevels(user.referralFromId);
      // console.log(`Processing referral chain for user: ${user.email}`);
      console.log("ibAccounts",ibAccounts);
     const startTime=Date.now();
     console.log("startTime START",startTime);

      for (const account of ibAccounts) {
        const level = Number(Object.keys(account)[0]);
        const ibAccountNumber = Number(account[level]);

        // console.log(`Processing level ${level} with IB account: ${ibAccountNumber}`);

        // Find matching IB commission rule
        const matchedIbLevel = adminIB.find((lvl) => lvl.level === level);
        if (!matchedIbLevel || !ibAccountNumber) {
          // console.log(`No matching IB level or account number for level ${level}, skipping...`);
          continue;
        }

        try {
          // Check if commission for this level already exists (atomic check)
          const existingTrade = await CloseTradeModel.findOne({
            _id: trade._id,
            "commissions.level": level,
          });
          if (existingTrade) {
            // console.log(`Commission for level ${level} already exists for trade ${trade.ticket}, skipping...`);
            continue;
          }

          // Calculate commission amount
          const commissionAmount = Number((trade.lotSize * matchedIbLevel.commission).toFixed(4));
          // console.log(`Depositing commission: ${commissionAmount} to account ${ibAccountNumber}`);

  
          // console.log("depositToUser",depositToUser?.ibBalance);

          // Atomically update the commissions array
          const updateResult = await CloseTradeModel.updateOne(
            {
              _id: trade._id,
              "commissions.level": { $ne: level }, // Prevent duplicate level
            },
            {
              $push: {
                commissions: {
                  level: level,
                  commissionAmount: commissionAmount,
                  ibAccountNumber: ibAccountNumber,
                  isCalculated: true,
                },
              },
            }
          );

          if (updateResult.modifiedCount === 0) {
            console.log(`Failed to add commission for level ${level} in trade ${trade.ticket}, possibly due to existing level or race condition.`);
            continue;
          }
          const depositToUser = await UserModel.findOneAndUpdate(
            { referralAccount: ibAccountNumber }, // match by referral ID
            { $inc: { ibBalance: +commissionAmount } },
            { new: true, runValidators: true }
          );

          // Update IB statistics
         const  updateIbList = await userIbListModel.updateOne(
            {
              loggedUserReferralAccount: ibAccountNumber,
              email: user.email,
              accountNumber: trade.mt5Account,
            },
            {
              $set: {
                accountNumber: trade.mt5Account,
                loggedUserReferralAccount: ibAccountNumber,
                level: level,
                name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                country: user.country || "Unknown",
                email: user.email || "No Email Provided",
              },
              $inc: {
                totalCommission: commissionAmount,
                totalLot: trade.lotSize,
              },
            },
            { upsert: true }
          );
          // console.log("updateIbList",updateIbList);

          // console.log(`Successfully processed commission for trade ${trade.ticket} at level ${level}`);
        } catch (error) {
          console.log(`Error in deposit for account ${ibAccountNumber} at level ${level}:`, error?.response?.data?.message || error?.response || error);
        }
      }
      console.log("startTime",startTime);
    }

    // console.log("IB commission processing completed");
  } catch (error) {
    console.log("ERROR in deposit ib commission:", error);
  }
});