
const sAdminPassword = `@foreX@${process.env.MANAGER_INDEX}`;
const SessionModel= require("../models/user/SessionModel");

const jwt=require("jsonwebtoken");
const crypto=require("crypto");
const bcrypt=require("bcrypt");

const superadminUserModel=require("../models/superadmin/superadminModel");





const verifySAdminPassword = async(req, res) => {
  const { password } = req.body;

  try{
    const userExist=await superadminUserModel.findOne({email:"superadmin@local"});

    
   const passwordMatch=await bcrypt.compare(password,userExist.password);

  // console.log("Incoming pass :- " ,  password )
  //   console.log( "Actuall password :- " , sAdminPassword  )



    let sessionId;
let sessionExists = true;
let attempts = 0;

while (sessionExists && attempts < 5) {
  sessionId = crypto.randomBytes(16).toString("hex");

  const found = await SessionModel.findOne({ sessionId });

  if (!found) {
    sessionExists = false; // unique mil gaya
  }

  attempts++;
}

const superadminAccessToken = jwt.sign(
  {
    userId: userExist._id,
    role: "superadminusers", //role change...krna h..
    sessionId: sessionId,
  },
  process.env.JWT_SECRET,
  {expiresIn: process.env.JWT_EXPIRES_IN || "15m"}, //Token expires within 15 min
);

const data= await SessionModel.create({
  userId: userExist._id,
  sessionId: sessionId,
  role: "superadminusers",

  expiresAt: new Date(Date.now() + 15*60*1000) //15minutes
});


// console.log("accessToken",accessToken);
  res.cookie("sact", superadminAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 15* 60 * 1000, //Token expires within 10 miniutes
    });

    return res.status(200).json({ success: true, message: 'Super Admin login successful.' });
  } 

catch(e){
 console.log("error",e);
 return res.status(500).json({message:"Server Error",error:e.message});

}
}

module.exports = { verifySAdminPassword };





