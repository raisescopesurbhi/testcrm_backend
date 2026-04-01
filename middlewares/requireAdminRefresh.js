const jwt=require("jsonwebtoken");
const SessionModel=require("../models/user/SessionModel");



const refreshAdminToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.adminrt;  

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET
    );

    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
      isRevoked: false,
    });

    // if (!session) {
    //   return res.status(401).json({ message: "Session invalid" });
    // }

    if(session.isRevoked){
      return res.status(401).json({message:"Session is revoked"});
    }


    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        role: "adminusers",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("adminut", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge:60* 60 * 1000,  //admin //1hr
    });

    return res.status(200).json({ message: "Admin access token refreshed" });

  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

  module.exports=refreshAdminToken;