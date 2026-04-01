const UserModel = require("../models/user/userModel");
const DepositModel = require("../models/user/DepositModel");
const WithdrawalModel = require("../models/user/WithdrawalModel");
const referalWithdrawalModel = require("../models/user/ReferralWithdrawalModel");


// user report --------
const getUserStatsController = async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);
  
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setHours(0, 0, 0, 0);
  
      const stats = await UserModel.aggregate([
        {
          $facet: {
            totalUsers: [{ $count: "count" }],
            kycVerified: [{ $match: { kycVerified: true } }, { $count: "count" }],
            kycUnverified: [{ $match: { kycVerified: false } }, { $count: "count" }],
            emailVerified: [{ $match: { emailVerified: true } }, { $count: "count" }],
            emailUnverified: [{ $match: { emailVerified: false } }, { $count: "count" }],
            totalIbUsers: [{ $match: { referralAccount: { $exists: true, $ne: null } } }, { $count: "count" }],
            totalReferralUsers: [{ $match: { referralFromUserId: { $exists: true, $ne: null } } }, { $count: "count" }],
            todayCount: [
              { $match: { createdAt: { $gte: today } } },
              { $count: "count" },
            ],
            lastWeekCount: [
              { $match: { createdAt: { $gte: lastWeek } } },
              { $count: "count" },
            ],
            lastMonthCount: [
              { $match: { createdAt: { $gte: lastMonth } } },
              { $count: "count" },
            ],
          },
        },
      ]);
  
      const format = (arr) => (arr[0]?.count || 0);
      const result = {
        totalUsers: format(stats[0].totalUsers),
        kycVerified: format(stats[0].kycVerified),
        kycUnverified: format(stats[0].kycUnverified),
        emailVerified: format(stats[0].emailVerified),
        emailUnverified: format(stats[0].emailUnverified),
        totalIbUsers: format(stats[0].totalIbUsers),
        totalReferralUsers: format(stats[0].totalReferralUsers),
        todayCount: format(stats[0].todayCount),
        lastWeekCount: format(stats[0].lastWeekCount),
        lastMonthCount: format(stats[0].lastMonthCount), 
      };
  
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to fetch user stats" });
    }
  };
//   deposit report --------
const getDepositStatsController = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setHours(0, 0, 0, 0);

    const stats = await DepositModel.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          pending: [{ $match: { status: "pending" } }, { $count: "count" }],
          rejected: [{ $match: { status: "rejected" } }, { $count: "count" }],
          approved: [{ $match: { status: "approved" } }, { $count: "count" }],
          todayApproved: [
            { $match: { status: "approved", createdAt: { $gte: today } } },
            { $count: "count" },
          ],
          lastWeekApproved: [
            { $match: { status: "approved", createdAt: { $gte: lastWeek } } },
            { $count: "count" },
          ],
          lastMonthApproved: [
            { $match: { status: "approved", createdAt: { $gte: lastMonth } } },
            { $count: "count" },
          ],
        },
      },
    ]);

    const format = (arr) => (arr[0]?.count || 0);

    const result = {
      total: format(stats[0].total),
      pending: format(stats[0].pending),
      rejected: format(stats[0].rejected),
      approved: format(stats[0].approved),
      todayApproved: format(stats[0].todayApproved),
      lastWeekApproved: format(stats[0].lastWeekApproved),
      lastMonthApproved: format(stats[0].lastMonthApproved),
    };

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch deposit stats" });
  }
};
//   withdrawal report --------
 const getWithdrawalStatsController = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setHours(0, 0, 0, 0);

    const stats = await WithdrawalModel.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          pending: [{ $match: { status: "pending" } }, { $count: "count" }],
          rejected: [{ $match: { status: "rejected" } }, { $count: "count" }],
          approved: [{ $match: { status: "approved" } }, { $count: "count" }],
          todayApproved: [
            { $match: { status: "approved", createdAt: { $gte: today } } },
            { $count: "count" },
          ],
          lastWeekApproved: [
            { $match: { status: "approved", createdAt: { $gte: lastWeek } } },
            { $count: "count" },
          ],
          lastMonthApproved: [
            { $match: { status: "approved", createdAt: { $gte: lastMonth } } },
            { $count: "count" },
          ],
        },
      },
    ]);

    const format = (arr) => (arr[0]?.count || 0);

    const result = {
      total: format(stats[0].total),
      pending: format(stats[0].pending),
      rejected: format(stats[0].rejected),
      approved: format(stats[0].approved),
      todayApproved: format(stats[0].todayApproved),
      lastWeekApproved: format(stats[0].lastWeekApproved),
      lastMonthApproved: format(stats[0].lastMonthApproved),
    };

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch withdrawal stats" });
  }
};
// ib-withdrawal report ---------

const getIBWithdrawalsStatsController = async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);
  
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setHours(0, 0, 0, 0);
  
      const stats = await referalWithdrawalModel.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            pending: [{ $match: { status: "pending" } }, { $count: "count" }],
            rejected: [{ $match: { status: "rejected" } }, { $count: "count" }],
            approved: [{ $match: { status: "approved" } }, { $count: "count" }],
            todayApproved: [
              { $match: { status: "approved", createdAt: { $gte: today } } },
              { $count: "count" },
            ],
            lastWeekApproved: [
              { $match: { status: "approved", createdAt: { $gte: lastWeek } } },
              { $count: "count" },
            ],
            lastMonthApproved: [
              { $match: { status: "approved", createdAt: { $gte: lastMonth } } },
              { $count: "count" },
            ],
          },
        },
      ]);
  
      const format = (arr) => (arr[0]?.count || 0);
  
      const result = {
        total: format(stats[0].total),
        pending: format(stats[0].pending),
        rejected: format(stats[0].rejected),
        approved: format(stats[0].approved),
        todayApproved: format(stats[0].todayApproved),
        lastWeekApproved: format(stats[0].lastWeekApproved),
        lastMonthApproved: format(stats[0].lastMonthApproved),
      };
  
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to fetch IB withdrawal stats" });
    }
  };  


  
module.exports = {getUserStatsController,getDepositStatsController,getWithdrawalStatsController,getIBWithdrawalsStatsController}