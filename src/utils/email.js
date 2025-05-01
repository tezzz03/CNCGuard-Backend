const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  await transporter.sendMail({
    from: 'no-reply@cncguard.com',
    to,
    subject,
    text,
  });
};

module.exports = { sendEmail };