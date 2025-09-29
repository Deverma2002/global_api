const mongoose = require('mongoose');

// Define the schema for the OTP model
const otpSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    otp: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    requestCount: {
        type: Number,
        default: 0
    },
    lastRequestTime: {
        type: Date,
        default: Date.now,
        expires: '24h' // TTL set to 24 hours on the last request time
    }
});

// Create the Mongoose model from the schema
const OTP = mongoose.model('OTP', otpSchema);

// Export the model
module.exports = OTP;