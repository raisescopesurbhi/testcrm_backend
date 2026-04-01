function OpenAccountMail({
  loggedUser,
  generateMt5,
  formData,
  siteConfig,
  VITE_WEBSITE_NAME,
  VITE_EMAIL_WEBSITE
}) {
  return `<!DOCTYPE html>
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
                <h1>Account Created</h1>
              </div>
              <div class="content">
                <p>Dear ${
                  loggedUser?.firstName + " " + loggedUser?.lastName
                },</p>
        <p>We are pleased to inform you that your MT5 trading account has been successfully created. Below are your account details:</p>
               <div class="withdrawal-details">

                <p>Account No: <span class="highlight">${
                  generateMt5.data.MT5Account
                }</span></p>
                  <p>Account Type: <span class="highlight">${
                    formData.accountType
                  }</span></p>
                  <p>Leverage: <span class="highlight">${
                    formData.leverage
                  }</span></p>
                  <p>Master Password: <span class="highlight">${
                    generateMt5.data.Master_Pwd
                  }</span></p>
                  <p>Investor Password: <span class="highlight">${
                    generateMt5.data.Investor_Pwd
                  }</span></p>
                  <p>Server Name: <span class="highlight">${
                    siteConfig?.serverName
                  }</span></p>
                  <p>Platform: <span class="highlight">${
                    formData.platform
                  }</span></p>
                </div>

          <p>Thank you for choosing us.</p>
          <p>Happy trading!</p>
                <p>Best regards,<br>The ${
                  VITE_WEBSITE_NAME || "Forex"
                } Team</p>
                <hr>

              </div>
               <div class="footer">
                 <div class="footer-info">
                  <p>Website: <a href="https://${
                    VITE_EMAIL_WEBSITE
                  }"> ${
    VITE_EMAIL_WEBSITE
  } </a> | E-mail: <a href="mailto:${VITE_EMAIL_WEBSITE || ""}">${
    VITE_EMAIL_WEBSITE || ""
  }</a></p>
                  <p>© 2025 ${
                    VITE_WEBSITE_NAME || ""
                  }. All Rights Reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>`;
}

// Export in CommonJS
module.exports = OpenAccountMail;
