
const TransferSnapshot=require("../models/TransferSnapshot");
const {makeWithdrawBalance, makeDepositBalance}=require("../services/meta.service")


const makeTransferServiceController=async(req,res)=>{
    const {fromAccount,toAccount,amount,comment}=req.body;
    try{

    if(!fromAccount ||!toAccount  ||!amount){
        return res.status(401).json({message:"All these things are required"});
    }

    const withdraw= await makeWithdrawBalance(fromAccount, amount, comment || "withdraw");
    if(withdraw.status===200||withdraw.status==="success"){
const deposit= await makeDepositBalance(toAccount, amount, comment || "deposit");
       if(deposit.status==200 || deposit.status==="success"){
        const TransferSnapshotTable=await TransferSnapshot.create({
            fromAccount:fromAccount,
            toAccount:toAccount,
            amount:amount,
            comment:comment,
        })
            res.status(200).json({
        message:"transfer Successful",
        transfer:TransferSnapshotTable,
    })
       }
    }
}
catch(e){
 console.log("error",e);
 return res.status(500).json({message:"Server Error",error:e.message});
}
}


module.exports={makeTransferServiceController};