const jwt= require("jsonwebtoken");
const SessionModel=require('../models/user/SessionModel');

const superadminauthenticate = async (req, res, next) => {
  try {
    const accessToken = req.cookies.sact;

    // Token check
    if (!accessToken) {
      return res.status(401).json({
        message: "Unauthorized messenger",
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
    });
  }
};

module.exports = { superadminauthenticate };