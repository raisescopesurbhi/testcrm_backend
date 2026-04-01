const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();



console.log("SMTP Host:", process.env.NODEMAILER_SMTP);
console.log("SMTP Port:", process.env.NODEMAILER_PORT);


const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_SMTP,
  port: parseInt(process.env.NODEMAILER_PORT) || 587,
  secure: false, // false for STARTTLS
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // <- Allow self-signed certs
  },
});


module.exports = transporter;
