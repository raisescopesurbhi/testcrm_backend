const express = require("express");

const {
  setupCopyingController,
  getMasterDetailsController,
  getAllCopiersController,
} = require("../controllers/CopierController.js");

const apiKeyMiddleware = require("../middlewares/apiKeyMiddleware.js");

const router = express.Router();
const { userauthenticate } = require("../middlewares/userauthenticate.js");
router.use(userauthenticate);

/**
 * ✅ IMPORTANT (recommended):
 * Add auth middleware here (JWT etc.)
 * router.use(requireUserAuth)
 */

// Optional: ownership check helper (recommended)
// async function ensureAccountBelongsToUser(req, mt5Account) {
//   // Example logic (adapt to your schema):
//   // if (req.user.role === "admin") return;
//   // const owns = req.user.accounts?.some(a => String(a.accountNumber) === String(mt5Account));
//   // if (!owns) throw new Error("Unauthorized MT5 account");
// }

router.post("/setup-copying", apiKeyMiddleware, setupCopyingController);

router.get("/master/:masterId", apiKeyMiddleware, getMasterDetailsController);

router.get("/all-copiers", apiKeyMiddleware, getAllCopiersController);

module.exports = router;
