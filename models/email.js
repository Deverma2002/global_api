const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['success', 'failed'], required: true },
  response: { type: String }, // SMTP response or error message
  messageId: { type: String }, // Unique message ID from Nodemailer
  timestamp: { type: Date, default: Date.now },
  sender: { type: String, required: true },
});

const EmailLog = mongoose.model('EmailLog', EmailLogSchema);
module.exports = EmailLog;