// import { metaClient } from "./metaClient.js";

// const MI = () => process.env.MANAGER_INDEX;


// export async function makeWithdrawBalance(mt5Account, amount, comment = "transfer") {
//   const { data } = await metaClient.get(
//     `/MakeWithdrawBalance?Manager_Index=${encodeURIComponent(MI())}&MT5Account=${encodeURIComponent(mt5Account)}&Amount=${encodeURIComponent(amount)}&Comment=${encodeURIComponent(comment)}`
//   );
//   return data;
// }

// // export async function makeDepositBalance(mt5Account, amount, comment = "deposit") {
// //   try{
// //   const { data } = await metaClient.get(
// //     `/MakeDepositBalance?Manager_Index=${encodeURIComponent(MI())}&MT5Account=${encodeURIComponent(mt5Account)}&Amount=${encodeURIComponent(amount)}&Comment=${encodeURIComponent(comment)}`
// //   );
// //   return data;
// // }


// export async function makeDepositBalance(Mt5Account, Amount, Comment = "deposit") {
//   try {
//     const { data } = await metaClient.get(
//       `/MakeDepositBalance?Manager_Index=${encodeURIComponent(MI())}` +
//       `&MT5Account=${encodeURIComponent(Mt5Account)}` +
//       `&Amount=${encodeURIComponent(Amount)}` +
//       `&Comment=${encodeURIComponent(Comment)}`
//     );

//     return data;
//   } catch (error) {
//     console.error("Error in makeDepositBalance:", error);
    
//   }
// }










