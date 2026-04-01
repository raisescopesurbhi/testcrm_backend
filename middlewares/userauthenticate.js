const jwt=require("jsonwebtoken");
const SessionModel=require('../models/user/SessionModel');

const userauthenticate = async (req, res, next) => {
  try {
    const accessToken = req.cookies.userat;
    const refreshToken = req.cookies.userrt;

    // Token check
    if (!accessToken) {
      return res.status(401).json({
        message: "Unauthorized messenger",
      });
    }

    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized messenging",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET
    );

    // Find session                                             //userauthenticate
    const session = await SessionModel.findOne({                //adminauthenticate
      sessionId: decoded.sessionId,                             //superadminauthenticate
    });

    if (!session) {
      return res.status(401).json({
        message: "Unauthorized msg",
      });
    }

    // Auto revoke expired session
    if (session.isRevoked || session.expiresAt < new Date()) {

      await SessionModel.updateOne(
        { sessionId: decoded.sessionId },
        { isRevoked: true }
      );

      return res.status(401).json({
        message: "Session expired",
      });
    }
    console.log("user id hit ----------------------------->>>>>>>>>" , decoded);
    

    // Attach user
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized message",
      message:error.message,


    });
  }
};

module.exports = { userauthenticate };