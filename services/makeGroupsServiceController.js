
const {getgroups}=require("../services/meta.service")


const makeGroupsServiceController=async(req,res)=>{
    try{

        const groups=await  getgroups();
        console.log()
         return res.status(200).json({
            message:"Groups found",
            Groups:groups
         })
    }
    catch(e){
      console.log("Error is",e);
      return res.status(500).json({message:"Server error", error:e.essage});
    }
}
module.exports={makeGroupsServiceController};

