const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const EmailLog = require('../models/email');

const EMAIL_CONFIG = {
  host:'smtp.gmail.com', // Replace with your SMTP host
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'patiltanmay108@gmail.com', // Replace with your email
    pass: 'xurbgxougnsiwmnr' // Replace with your app password
  }
};

// Create nodemailer transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);


router.post('/send_email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  const mailOptions = {
    from: EMAIL_CONFIG.auth.user,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Log successful email
    await EmailLog.create({
      to,
      subject,
      status: 'success',
      response: info.response,
      messageId: info.messageId,
      sender: EMAIL_CONFIG.auth.user,
      
    });

    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    // Log failed email
    await EmailLog.create({
      to,
      subject,
      status: 'failed',
      response: error.message,
      sender: EMAIL_CONFIG.auth.user,
      
    });

    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports=router