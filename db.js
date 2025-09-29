const mongoose = require('mongoose');

// Use your local MongoDB URL for the 'otp_service' database
// const mongoURL = 'mongodb://localhost:27017/otp_service';
const mongoURL='mongodb://watcho2:watcho2123@10.160.0.56:27017/watcho2db'
// Connect to the MongoDB database
mongoose.connect(mongoURL);

const db = mongoose.connection;

db.on('connected', () => {
    console.log('✅ Connected to MongoDB successfully');
});

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// Export the connection object
module.exports = db;
