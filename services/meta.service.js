import { copyClient, metaClient } from "./metaClient.js";

const MI = () => process.env.MANAGER_INDEX;

 async function getUserInfo(mt5Account) {
  const { data } = await metaClient.get(
    `/GetUserInfo?Manager_Index=${encodeURIComponent(MI())}&MT5Account=${encodeURIComponent(mt5Account)}`
  );
  return data;
}

export async function makeWithdrawBalance(mt5Account, amount, comment = "withdraw") {
  const { data } = await metaClient.get(
    `/MakeWithdrawBalance?Manager_Index=${encodeURIComponent(MI())}&MT5Account=${encodeURIComponent(mt5Account)}&Amount=${encodeURIComponent(amount)}&Comment=${encodeURIComponent(comment)}`
  );
  return data;
}

// export async function makeDepositBalance(mt5Account, amount, comment = "deposit") {
//   try{
//   const { data } = await metaClient.get(
//     `/MakeDepositBalance?Manager_Index=${encodeURIComponent(MI())}&MT5Account=${encodeURIComponent(mt5Account)}&Amount=${encodeURIComponent(amount)}&Comment=${encodeURIComponent(comment)}`
//   );
//   return data;
// }


export async function makeDepositBalance(MT5Account, Amount, Comment = "deposit") {
  try {
    const { data } = await metaClient.get(
      `/MakeDepositBalance?Manager_Index=${encodeURIComponent(MI())}` +
      `&MT5Account=${encodeURIComponent(MT5Account)}` +
      `&Amount=${encodeURIComponent(Amount)}` +
      `&Comment=${encodeURIComponent(Comment)}`
    );

    return data;
  } catch (error) {
    console.error("Error in makeDepositBalance:", error);
    
  }
}


export async function getgroups(){
  const { data } = await metaClient.get(
    `/GetGroups?Manager_Index=${encodeURIComponent(MI())}`
  );
  return data;
}
  export async function getUserInfoByAccounts(accountIds) {
  const { data } = await metaClient.post(`/GetUserInfoByAccounts`, {
    Manager_Index: MI(),
    MT5Accounts: accountIds,
  });

  console.log("data is going and coming",data);
  return data;
}

export async function getOpenTradesByAccount(mt5Account) {
  const { data } = await metaClient.get(
    `/GetOpenTradeByAccount?Manager_Index=${encodeURIComponent(MI())}&MT5Accont=${encodeURIComponent(mt5Account)}`
  );

  console.log("border");
  return data;
}

export async function getCloseTradeAllUsers(startTime,endTime) {
  console.log("starting Time is",startTime);

  console.log("ending Time is",endTime);
  // const { data } = await metaClient.get(
  //   `/GetCloseTradeAllUsers?Manager_Index=${encodeURIComponent(MI())} +
  //     &StartTime=${encodeURIComponent(startTime)} + 
  //     &EndTime=${encodeURIComponent(endTime)}`
  // );

  const { data } = await metaClient.get(
  `/GetCloseTradeAllUsers?Manager_Index=${encodeURIComponent(MI())}&StartTime=${encodeURIComponent(startTime)}&EndTime=${encodeURIComponent(endTime)}`
);

  return data;
}


export async function getCloseTradeAll(mt5Account, startTime, endTime) {
  const { data } = await metaClient.get(
    `/GetCloseTradeAll?Manager_Index=${encodeURIComponent(MI())}` +
      `&MT5Accont=${encodeURIComponent(mt5Account)}` +
      `&StartTime=${encodeURIComponent(startTime)}` +
      `&EndTime=${encodeURIComponent(endTime)}`
  );





  return data;
}


 export async function getUserInfoService(req, res) {
    try {
      const mt5Account = req.params.mt5Account;
      console.log("Fetching user info for MT5 account:", mt5Account);
      // await ensureAccountBelongsToUser(req, mt5Account);
  
      const data = await getUserInfo(mt5Account);
      res.json({ ok: true, data });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message || "Meta error" });
    }
  }

  export async function makeDepositBalanceService (req, res) {
  try {
    const { MT5Account, amount, comment } = req.body;

    if (!MT5Account || !amount) {
      return res.status(400).json({ ok: false, message: "MT5Account & amount required" });
    }

    const data = await makeDepositBalance(MT5Account, amount, comment || "deposit");
    console.log("Data is",data);
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
};



export async function makeWithdrawBalanceService (req, res) {
  try {
    const { mt5Account, amount, comment } = req.body;

    if (!mt5Account || !amount) {
      return res.status(400).json({ ok: false, message: "mt5Account & amount required" });
    }

    const data = await makeWithdrawBalance(mt5Account, amount, comment || "deposit");
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
};

export async function makeGroupsService(req,res){
  try {
    // await ensureAccountBelongsToUser(req, mt5Account);

    const data = await getgroups();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
};
export async function getUserInfoByAccountsService(req,res){
  try {
    const { accountIds } = req.body;

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ ok: false, message: "accountIds array required" });
    }

    const data = await getUserInfoByAccounts(accountIds);
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }

}

export async function getOpenTradeService(req,res){
  try {
    const { mt5Account } = req.params;
    console.log(mt5Account);
    const data = await getOpenTradesByAccount(mt5Account);
    // console.log("data",data);
    return res.status(200).json({ ok: true, data });
  } catch (e) {

    console.log("error",e);
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
}
export async function getCloseTradeService(req,res){
  try {
    const { mt5Account } = req.params;
    console.log("mt5Account",mt5Account);

    const startTime = "2021-07-20 00:00:00";
    const endTime =
      `${new Date().toISOString().slice(0, 10)} 23:59:59`;


    const data = await getCloseTradeAllUsers(startTime,endTime);
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
}
export async function getCloseTradeAllService(req,res){
  try {
    const { mt5Account } = req.params;

    const startTime = req.query.startTime || "2021-07-20 00:00:00";
    const endTime =
      req.query.endTime || `${new Date().toISOString().slice(0, 10)} 23:59:59`;

    const data = await getCloseTradeAll(mt5Account, startTime, endTime);
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
}

export async function getCloseTradeAllUsersService(req,res){
  try {
    const { startTime, endTime } = req.query;

    if (!startTime) {
      return res.status(400).json({
        ok: false,
        message: "startTime is required. Format: YYYY-MM-DD HH:mm:ss",
      });
    }

    const data = await getCloseTradeAllUsers(
      String(startTime),
      endTime ? String(endTime) : "2050-12-30 23:59:59"
    );

    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Meta error" });
  }
};

export async function getTransferService(req,res){
  try {
      const { fromAccount, toAccount, amount } = req.body;

      console.log(fromAccount,toAccount,amount);
  
      if (!fromAccount || !toAccount || !amount) {
        return res.status(400).json({ ok: false, message: "fromAccount, toAccount, amount required" });
      }
      if (String(fromAccount) === String(toAccount)) {
        return res.status(400).json({ ok: false, message: "fromAccount and toAccount must be different" });
      }
  
      const withdrawal = await makeWithdrawBalance(fromAccount, amount, "transfer");
      if (!isTxnSuccess(withdrawal)) {
        throw new Error(withdrawal?.message || withdrawal?.Message || "Withdrawal failed");
      }
  
      const deposit = await makeDepositBalance(toAccount, amount, "transfer");
      if (!isTxnSuccess(deposit)) {
        throw new Error(deposit?.message || deposit?.Message || "Deposit failed");
      }
  
      // ✅ INSERT SNAPSHOT AFTER BOTH SUCCESS
      const snap = await TransferSnapshot.create({
        fromAccount: Number(fromAccount),
        toAccount: Number(toAccount),
        amount: Number(amount),
        comment: "transfer",
        status: "completed",
        withdrawal,   // stores full withdraw response
        deposit,      // stores full deposit response
        errorMessage: "",
        // userId: req.user?._id, // add if you have auth
      });
  
      res.json({ ok: true, snapshotId: snap._id, withdrawal, deposit });
    } catch (e) {
      console.log(e);
      res.status(500).json({ ok: false, message: e.message || "Transfer failed" });
    }
}
