const mongoose = require("mongoose");

const siteConfigScema = new mongoose.Schema({
  dollarDepositRate: {
    type: Number,
    default: 85,
  },
  dollarWithdrawalRate: {
    type: Number,
    default: 85,
  },
  serverName:{
    type:String,
    default:""
  },
  themeColor:{
    type:String,
    default:"#6080FF"
  },
  mt5Digit:{
    type:Number,
    default:6
  },
  websiteName:{
    type:String,
  },
  logo:{
    type:String,
  },
  favicon:{
    type:String,
  },
  tNcLink:{
    type:String,
  },
  androidDL:{
    type:String,
  },
  iosDL:{
    type:String,
  },
  windowsDL:{
    type:String,
  },
  webLink:{
    type:String,
  },
  inrUi:{
    type:Boolean,
    default:true
  },
  logoSize:{
    type:Number,
    default:4
  },
 
});

const siteConfigModel = mongoose.model("siteConfig", siteConfigScema);
module.exports = siteConfigModel;
