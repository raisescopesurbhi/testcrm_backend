const withdrawalModel=require("../models/user/WithdrawalModel");
const {makeWithdrawBalance}=require("../services/meta.service");

const makeWithdrawBalanceServiceController=async(req,res)=>{
    const {id}=req.params;
    const {comment}=req.body;

    try{
        const withdrawData=await withdrawalModel.findById(id);

        if(!withdrawData){
            return res.status(401).json({message:"Id not found"});
        }
        const MT5Account=withdrawData.mt5Account
        const amount=withdrawData.amount
        

        const metaResponse=await makeWithdrawBalance(MT5Account,amount,comment||"withdraw");
        if(metaResponse.status==="approved"){
            return res.status(200).json({message:"Already approved"});
        }
        if(metaResponse.status===200 || metaResponse.status==="success"){
            withdrawData.status="approved",
            await withdrawData.save();
          return res.status(200).json({message:"Withdraw Approved",
            withdrawData,
          })
        }
        else{
            return res.status(401).json({message:"Not withdraw successful"});
        }
    }
    catch(e){
       console.log("error",e);
       return res.status(500).json({message:"Server Error",error:e.message});
    }
}
module.exports={makeWithdrawBalanceServiceController};



