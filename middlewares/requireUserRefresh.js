const jwt=require("jsonwebtoken");
const SessionModel=require("../models/user/SessionModel");



const refreshUserToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.userrt;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET
    )

    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
       isRevoked: false,
    });

    if (!session) {
      return res.status(401).json({ message: "Session invalid" });
    }
    if(session.isRevoked){
      return res.status(401).json({message:"Session revoked"});
    }

    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        role: "users",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("userat", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, //1 min
    });

    return res.status(200).json({ message: "User access token refreshed" });

  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

module.exports=refreshUserToken;