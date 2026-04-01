
const CloseTradeModel = require("../models/user/closedTradesModel");
const openTradesModel = require("../models/user/openTrades");
const { metaApi } = require("../utils/apiClients");  
const Cron = require("node-cron")
console.log("trades cron running..");
// function to delete openTrades based on closeTrades --


const deleteOpenTrades = async ()=>{
    try {
        const closedTrades = await CloseTradeModel.find({}, 'positionId');
        const closedPositionId = closedTrades.map(trade => trade.positionId);
    
        if (closedPositionId.length === 0) {
          console.log("No closed trades found.");
          return;
        }
    
        // // Delete open trades where Ticket exists in closedTickets
        const result = await openTradesModel.deleteMany({ Ticket: { $in: closedPositionId } });
        // console.log(`${result.deletedCount} open trades deleted based on closed trades.`);
      } catch (error) {
        console.error("Error removing closed trades from open trades:", error);
      }
}

//save open trades
Cron.schedule("*/40 * * * * *" , async()=>{
    try {
        const apiRes =   await metaApi.get(
            `/GetOpenTradeAll?Manager_Index=${process.env.MANAGER_INDEX}`
          );
          const openTrades = apiRes.data.openTrades
          if(!Array.isArray(openTrades)) return
          if(openTrades.length>0){
            for (const trade of openTrades){
                const isExist = await openTradesModel.findOne({"Ticket":trade.Ticket});
                if(!isExist){
                    await openTradesModel.create(trade)
                    // console.log(`Stored Ticket: ${trade.Ticket}`);
                }
                else {
                    // console.log(`Ticket already exists: ${trade.Ticket}`);
                  }
            }
            deleteOpenTrades()
          }
          else {
            console.log("No open trades received");
          }
        
    } catch (error) {
       console.log("error in saving openTrades",error); 
    }

})
