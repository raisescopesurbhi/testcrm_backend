// controllers/analyticsController.js
const DepositModel = require("../models/user/DepositModel");
const WithdrawalModel = require("../models/user/WithdrawalModel");

// Statuses considered as successful/settled amounts
const DEPOSIT_SUCCESS = ["approved", "success", "finished", "confirmed", "completed", "paid"];
const WITHDRAW_SUCCESS = ["approved", "success", "finished", "confirmed", "completed", "paid", "processed"];

// Build array of { key: 'YYYY-MM', label: 'Mon' } between start and end (inclusive)
function buildMonthBuckets({ startMonth, endMonth }) {
  const res = [];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const cur = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth(), 1));
  const end = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth(), 1));

  while (cur <= end) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    res.push({ key, label: monthNames[m - 1] });
    // next month (UTC-safe)
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return res;
}

// Parse date range from query
function parseRange(q) {
  const now = new Date();
  const months = Math.max(1, Math.min(60, Number(q.months || 12))); // cap at 60

  if (q.from && q.to) {
    const from = new Date(`${q.from}-01T00:00:00.000Z`); // YYYY-MM
    const to = new Date(`${q.to}-01T00:00:00.000Z`);
    if (isNaN(from) || isNaN(to) || from > to) {
      throw new Error("Invalid from/to; expected YYYY-MM and from<=to");
    }
    // endExclusive = first day of month after 'to'
    const endExclusive = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 1));
    return {
      startInclusive: from,
      endExclusive,
      startMonth: from,
      endMonth: to,
    };
  } else {
    // Last N months including current
    const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startMonth = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() - (months - 1), 1));
    const endExclusive = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() + 1, 1));
    return {
      startInclusive: startMonth,
      endExclusive,
      startMonth,
      endMonth,
    };
  }
}

const getDepositsVsWithdrawalsController = async (req, res) => {
  try {
    const { startInclusive, endExclusive, startMonth, endMonth } = parseRange(req.query);

    // Build month buckets for response
    const buckets = buildMonthBuckets({ startMonth, endMonth }); // [{key:'YYYY-MM', label:'Mon'}]

    // ---------------- Aggregate Deposits ----------------
    const depMatch = {
      createdAt: { $gte: startInclusive, $lt: endExclusive },
      // include only successful/approved deposits if status exists
      ...(req.query.includeAll ? {} : { status: { $in: DEPOSIT_SUCCESS } }),
    };

    const depAgg = await DepositModel.aggregate([
      { $match: depMatch },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          total: {
            $sum: {
              $toDouble: {
                $ifNull: ["$deposit", 0], // deposit may be string/number
              },
            },
          },
        },
      },
    ]);

    // ---------------- Aggregate Withdrawals ----------------
    const wdrMatch = {
      createdAt: { $gte: startInclusive, $lt: endExclusive },
      ...(req.query.includeAll ? {} : { status: { $in: WITHDRAW_SUCCESS } }),
    };

    const wdrAgg = await WithdrawalModel.aggregate([
      { $match: wdrMatch },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          total: {
            $sum: {
              $toDouble: {
                $ifNull: ["$amount", 0], // amount may be string/number
              },
            },
          },
        },
      },
    ]);

    // Map results to YYYY-MM
    const depMap = new Map();
    for (const row of depAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, "0")}`;
      depMap.set(key, row.total);
    }
    const wdrMap = new Map();
    for (const row of wdrAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, "0")}`;
      wdrMap.set(key, row.total);
    }

    // Build months array (ensure zeros where missing)
    const months = buckets.map(({ key, label }) => ({
      month: key,
      label,
      deposits: Number(depMap.get(key) || 0),
      withdrawals: Number(wdrMap.get(key) || 0),
    }));

    // Totals for returned window
    const totals = months.reduce(
      (acc, m) => {
        acc.deposits += m.deposits;
        acc.withdrawals += m.withdrawals;
        return acc;
      },
      { deposits: 0, withdrawals: 0 }
    );

    return res.json({ data: { months, totals } });
  } catch (err) {
    console.error("analytics/deposits-vs-withdrawals error:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

module.exports = {
  getDepositsVsWithdrawalsController,
};
