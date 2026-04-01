const jwt=require("jsonwebtoken");
const SessionModel=require("../models/user/SessionModel");



const requireUser = async (req, res) => {
  try {
    const accessToken = req.cookies.userat;

    if (!accessToken) {
      return res.status(401).json({ message: "Access token missing" });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
      isRevoked: false,
    });

    if(session.isRevoked){
        return res.status(200).json({message:"User Login is successful"});
    }

    if (!session) {
      return res.status(401).json({ message: "Session invalid" });
    }


  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired access token" ,err});
  }
};

module.exports =  requireUser ;