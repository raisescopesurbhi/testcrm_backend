const jwt=require("jsonwebtoken");
const SessionModel=require("../models/user/SessionModel");



const requireSuperadmin = async (req, res) => {
  try {
    const accessToken = req.cookies.sact;

    if (!accessToken) {
      return res.status(401).json({ message: "Access token missing" });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
      isRevoked: false,
    });

    if(session.isRevoked){
        return res.status(401).json({message:"Session is revoked"});
    }

    return res.status(200).json({message:"Superadmin Login is successful"});

  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

module.exports=requireSuperadmin;