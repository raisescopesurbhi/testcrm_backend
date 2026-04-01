// src/emails/depositDecisionMail.js
// Backend (CommonJS) email template for Deposit Approved/Rejected

const WEBSITE_NAME  = process.env.WEBSITE_NAME  || "Arena Trade";
const EMAIL_WEBSITE = process.env.EMAIL_WEBSITE || "";
const EMAIL_EMAIL   = process.env.EMAIL_EMAIL   || "";

/** Subjects exposed for convenience */
const SUBJECT_APPROVED = `Deposit Request Approved - ${WEBSITE_NAME}`;
const SUBJECT_REJECTED = `Deposit Request Rejected - ${WEBSITE_NAME}`;

/** Escape HTML to avoid injection in comment or user inputs */
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Format timestamp in IST like "10/11/2025, 19:42:13" (DD/MM/YYYY, 24h) */
function formatISTDateTime(dateLike) {
  const d = dateLike ? new Date(dateLike) : new Date();
  const date = d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${date}, ${time}`;
}

/**
 * Build approval/rejection email for a Deposit
 * @param {Object} params
 * @param {"approve"|"reject"} params.actionType
 * @param {Object} params.selectedDeposit
 * @param {Object} [params.selectedDeposit.userId] - Preferred user object (frontend shape)
 * @param {Object} [params.selectedDeposit.userData] - Fallback user object (backend shape)
 * @param {string} [params.selectedDeposit.userId.firstName]
 * @param {string} [params.selectedDeposit.userId.lastName]
 * @param {string} [params.selectedDeposit.userData.firstName]
 * @param {string} [params.selectedDeposit.userData.lastName]
 * @param {string|number} [params.selectedDeposit.mt5Account]
 * @param {string|number} [params.selectedDeposit.accountType]
 * @param {string|number} [params.selectedDeposit.deposit] - Preferred amount prop
 * @param {string|number} [params.selectedDeposit.amount]  - Fallback amount prop
 * @param {string} [params.comment] - Optional admin note / reason
 * @param {Date|number|string} [params.timestamp] - Optional override for timestamp
 * @returns {{subject:string, html:string}}
 */
function getDepositDecisionMail({
  actionType,
  selectedDeposit = {},
  comment = "",
  timestamp,
} = {}) {
  const isApprove = actionType === "approved";

  // Support both shapes: selectedDeposit.userId.* (your API handler) and .userData.* (your withdrawal mail)
  const firstName =
    selectedDeposit?.userId?.firstName ??
    selectedDeposit?.userData?.firstName ??
    "";
  const lastName =
    selectedDeposit?.userId?.lastName ??
    selectedDeposit?.userData?.lastName ??
    "";
  const fullName = (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : "Trader";

  const mt5Account  = selectedDeposit?.mt5Account ?? "";
  const accountType = selectedDeposit?.accountType ?? "";
  const depositAmt  =
    selectedDeposit?.deposit ?? // your deposit handler prop
    selectedDeposit?.amount ??  // fallback
    "";

  const ts = formatISTDateTime(timestamp);
  const subject = isApprove ? SUBJECT_APPROVED : SUBJECT_REJECTED;

  const safeComment = comment && comment.trim() ? escapeHtml(comment) : "";

  // Choose border color for admin comment box
  const commentBorder = isApprove ? "#2d6a4f" : "#C70039";

  const statusTitle = isApprove ? "Approved" : "Rejected";
  const leadText = isApprove
    ? "We are pleased to inform you that your deposit has been successfully credited to your MT5 account."
    : "We regret to inform you that your deposit request has been rejected.";

  const closingText = isApprove
    ? "Thank you for choosing us. Happy trading!"
    : "If you have questions, please contact support.";

  const commentBlock = safeComment
    ? `<div class="admin-comment">
        <strong>${isApprove ? "Admin&#39;s Note:" : "Reason for Rejection:"}</strong><br/>
        ${safeComment}
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Deposit Request ${statusTitle} - ${escapeHtml(WEBSITE_NAME)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, html { margin:0; padding:0; font-family: 'Arial', sans-serif; line-height:1.6; color:#333; background-color:#f4f4f4; }
    .container { max-width:600px; margin:0 auto; padding:5px; background-color:#ffffff; }
    .header { background-color:#19422df2; color:#ffffff; padding:20px 15px; text-align:center; border-radius:10px 10px 0 0; }
    .header h1 { margin:0; font-size:22px; letter-spacing:1px; }
    .content { padding:10px 20px; }
    .cta-button { display:inline-block; padding:12px 24px; background-color:#2d6a4f; color:#FFFFFF; text-decoration:none; border-radius:5px; font-weight:bold; margin:10px 0; }
    .footer { background-color:#19422df2; color:#ffffff; text-align:center; padding:5px 10px; font-size:12px; border-radius:0 0 10px 10px; }
    .footer-info { margin-top:6px; }
    .footer-info a { color:#B6D0E2; text-decoration:none; }
    .deposit-details { background-color:#f8f8f8; border-left:4px solid #2d6a4f; padding:15px; margin:20px 0; }
    .deposit-details p { margin:5px 0; }
    .highlight { font-weight:bold; color:#0a2342; }
    .risk-warning { color:#C70039; padding:5px; font-size:12px; line-height:1.4; }
    .admin-comment { background:#f1f5f9; border-left:4px solid ${commentBorder}; padding:10px; margin:15px 0; font-style:italic; color:#333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Deposit ${statusTitle}</h1>
    </div>
    <div class="content">
      <p>Dear ${escapeHtml(fullName)},</p>
      <p>${leadText}</p>

      <div class="deposit-details">
        <p>Account No: <span class="highlight">${escapeHtml(String(mt5Account))}</span></p>
        <p>Account Type: <span class="highlight">${escapeHtml(String(accountType))}</span></p>
        <p>Deposit Amount: <span class="highlight">${escapeHtml(String(depositAmt))}</span></p>
        <p>Time Stamp: <span class="highlight">${escapeHtml(ts)}</span></p>
      </div>

      ${commentBlock}

      <p>${closingText}</p>
      <p>Best regards,<br>The ${escapeHtml(WEBSITE_NAME)} Team</p>
      <hr>
    </div>
    <div class="footer">
      <div class="footer-info">
        ${
          EMAIL_WEBSITE || EMAIL_EMAIL
            ? `<p>Website: <a href="https://${escapeHtml(EMAIL_WEBSITE)}">${escapeHtml(EMAIL_WEBSITE)}</a> | E-mail: <a href="mailto:${escapeHtml(EMAIL_EMAIL)}">${escapeHtml(EMAIL_EMAIL)}</a></p>`
            : ""
        }
        <p>&copy; ${new Date().getFullYear()} ${escapeHtml(WEBSITE_NAME)}. All Rights Reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

module.exports = {
  getDepositDecisionMail,
  SUBJECT_APPROVED,
  SUBJECT_REJECTED,
  formatISTDateTime,
  escapeHtml,
};
