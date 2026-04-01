const dotenv = require("dotenv");
const  transporter = require("../../config/user/emailTransportal");
const CustomMailModel = require("../../models/MailReference/MailTransportation");

dotenv.config();

/**
 * Send OTP Email
 * @param {Object} params
 * @param {string} params.email - Recipient's email
 * @param {string} params.otp - OTP code to send
 * @param {string} params.firstName - User's first name
 * @param {string} params.lastName - User's last name
 */
const sendOtpEmail = async ({ email, otp, firstName, lastName }) => {
  const subject = "Your OTP Code for Verification";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; }
    .header { background: #19422df2; color: #fff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .footer { background: #19422df2; color: #fff; text-align: center; padding: 10px; border-radius: 0 0 8px 8px; font-size: 12px; }
    .otp-box { font-size: 28px; font-weight: bold; background: #e0f7fa; padding: 10px 20px; display: inline-block; margin: 20px 0; border-radius: 6px; }
    .risk-warning { color: #C70039; font-size: 12px; }
    a { color: #B6D0E2; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${subject}</h1></div>
    <div class="content">
      <p>Dear ${firstName} ${lastName},</p>
      <p>Here is your One-Time Password (OTP) for verification:</p>
      <div class="otp-box">${otp}</div>
      <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
      <p>Best regards,<br>The ${process.env.WEBSITE_NAME || ""} Team</p>
      <hr>
      <div class="risk-warning">
        <strong>Risk Warning:</strong> Trading CFDs carries high risk and may result in losses beyond your initial investment.
        Trade only with money you can afford to lose and understand the risks. Our services are not for U.S. citizens or in jurisdictions
        where they violate local laws.
      </div>
    </div>
    <div class="footer">
  <p>${process.env.EMAIL_ADDRESS }</p>
    <p>Website: <a href="https://${process.env.EMAIL_WEBSITE}"> ${
        process.env.EMAIL_WEBSITE
      } </a> | E-mail: <a href="mailto:${
        process.env.EMAIL_EMAILL
      }">${process.env.EMAIL_EMAILL}</a></p>
    <p>We sent out this message to all existing ${
      process.env.WEBSITE_NAME
    } traders. Please visit this page to know more about our Privacy Policy.</p>
    <p>&copy; 2025 ${
      process.env.WEBSITE_NAME
    }. All Rights Reserved</p>
    </div>
  </div>
</body>
</html>`;

  try{
    const response= await transporter.sendMail({   
    from: `"${process.env.WEBSITE_NAME}" <${process.env.NODEMAILER_SENDER_EMAIL}>`,
    to: email,
    subject,
    html,
  });
  if(!response){
    return {success:false,message:"Server Error"};
  }
 const CustomModel=await CustomMailModel.create({
    emailId:email,
    subject:subject,
 })
 //No.of emails sent in one day 

 const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalMailCountToday = await CustomMailModel.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return {
      success: true,
      message: "Custom Mail for MT5 sent successfully",
      CustomModel,
      totalMailCountToday,
    };
  } catch (error) {
    console.log("error is", error);
    return {
      success: false,
      error: error.message,
    };
  }
};


module.exports = sendOtpEmail;
