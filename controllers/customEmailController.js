const UserModel = require("../models/user/userModel");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Nodemailer configuration for GoDaddy SMTP
const transporter =  nodemailer.createTransport({
  host: process.env.NODEMAILER_SMTP,
  port: process.env.NODEMAILER_PORT, // Alternative port
  secure: false,
  auth: {
    user: `${process.env.NODEMAILER_EMAIL}`,
    pass: `${process.env.NODEMAILER_PASSWORD}`,
  },
});

const sendMailsInLoopController = async (req, res) => {
  const { subject, text } = req.body;

  try {
    console.log("Starting email sending process...");
    // const users = await UserModel.find({ email: { $regex: /^vtf/i } });

    const users = await UserModel.find();
    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid email list" });
    }
    for (const user of users) {
      const customContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Withdrawal Request Confirmation - Arena Trade</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 5px;
      background-color: #ffffff;
    }
    .header {
      background-color: #19422df2;
      color: #ffffff;
      padding: 20px 15px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 1px;
    }
    .content {
      padding: 10px 20px;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2d6a4f;
      color: #FFFFFF;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 10px 0;
    }
    .footer {
      background-color: #19422df2;
      color: #ffffff;
      text-align: center;
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 0 0 10px 10px;
    }
    .footer-info {
      margin-top: 6px;
    }
    .footer-info a {
      color: #B6D0E2;
      text-decoration: none;
    }

    .withdrawal-details {
      background-color: #f8f8f8;
      border-left: 4px solid #2d6a4f;
      padding: 15px;
      margin: 20px 0;
    }
    .withdrawal-details p {
      margin: 5px 0;
    }
    .highlight {
      font-weight: bold;
      color: #0a2342;
    }
    .risk-warning {
      color: #C70039;
      padding: 5px;
      font-size: 12px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p>Dear ${user.firstName + " " + user.lastName},</p>
        <p>We would like to share an <strong>important update</strong> with you:</p>
        <p>${text}</p>
      <p>Best regards,<br>The ${
        process.env.WEBSITE_NAME
      } Team</p>
      <hr>
 <div class="risk-warning">
  <strong>Risk Warning:</strong> Trading CFDs carries high risk and may result in losses beyond your initial investment. Trade only with money you can afford to lose and understand the risks.
  <br><br>
  Our services are not for U.S. citizens or in jurisdictions where they violate local laws.
</div>

    </div>
      <div class="footer">
  <div class="footer-info">
  <p>${process.env.EMAIL_ADDRESS || "" }</p>
    <p>Website: <a href="https://${process.env.EMAIL_WEBSITE || ""}"> ${
        process.env.EMAIL_WEBSITE} </a> | E-mail: <a href="mailto:${process.env.EMAIL_EMAIL || ""}">${process.env.EMAIL_EMAIL}</a></p>
    <p>&copy; 2025 ${
      process.env.WEBSITE_NAME || ""
    }. All Rights Reserved</p>
  </div>
</div>
  </div>
</body>
      </html>`;
      try {
        await transporter.sendMail({
          from: `"${process.env.WEBSITE_NAME}" ${process.env.NODEMAILER_SENDER_EMAIL}`,
          to: user.email,
          subject: `${subject}`,
          html: `${customContent}`,
        });
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error.message);
      }
      // Optional delay to comply with SMTP server limits
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
    }

    res.status(200).json({ message: "All emails processed!++++++" });
  } catch (error) {
    console.error("Error in email sending process:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
};

module.exports = { sendMailsInLoopController };
