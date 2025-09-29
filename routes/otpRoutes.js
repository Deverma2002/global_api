const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const OTP = require('../models/otp'); // Import the OTP Mongoose model

// Your Kaleyra API credentials (hardcoded)
const sid = "HXIN1812247626IN";
const apiKey = "A681a2570ca9c3ef8e557dad7a898c646";
const baseUrl = "https://api.in.kaleyra.io";
const templateId = "1207161710760846658";
const sender = "FINCSH";
const validity = 5; // Validity in minutes

// Your reCAPTCHA secret key for V2 ""I am not a robot" checkbox"
// const recaptchaSecretKey = "6Le8b7srAAAAACT2qSacBj6MLQ8V3wRz_sUV5Lv3";

//Your reCAPTCHA secret key for V2 "Invisible reCAPTCHA v2" for domain nissan
// const recaptchaSecretKey = "6LcX3b4rAAAAABVhXRFKxlQ1G0099JI-2oJ9FEv5";

////Your reCAPTCHA secret key for V2 "Invisible reCAPTCHA v2 for vroom central domain"
const recaptchaSecretKey = "6LcFr8QrAAAAAOYAI-U_gzCENLQN2_JdPRSTh659";



// Endpoint to send OTP
router.post('/mobile_otp', async (req, res) => {
    const { mobile, "g-recaptcha-response": recaptchaToken } = req.body;

    if (!mobile) {
        return res.status(400).json({ error: "Mobile number is required." });
    }

    // ✅ RECAPTCHA VERIFICATION: First line of defense
    if (!recaptchaToken) {
        return res.status(400).json({ error: "reCAPTCHA token is required." });
    }

    try {
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaToken}`;
        const response = await axios.post(verificationUrl);
        const { success } = response.data;

        if (!success) {
            return res.status(400).json({ error: "reCAPTCHA verification failed. Please try again." });
        }

        // ✅ Mobile number validation: Only accept +91 followed by 10 digits
        const mobileRegex = /^\+91\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ error: "Invalid mobile number. Must be in format +91XXXXXXXXXX." });
        }

        // Find the user's OTP record
        let otpRecord = await OTP.findOne({ mobile: mobile });
        const now = new Date();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        // Check if a record exists
        if (otpRecord) {
            // Check if the last request was more than an hour ago
            if (now - otpRecord.lastRequestTime > oneHour) {
                // If it's been more than an hour, reset the counter
                otpRecord.requestCount = 1;
            } else {
                // If it's been less than an hour, check the count
                if (otpRecord.requestCount >= 5) {
                    return res.status(429).json({
                        message: "Too many OTP requests. Please try again after one hour.",
                        status: "FAILURE"
                    });
                }
                // Increment the request count
                otpRecord.requestCount++;
            }
            // Always update the lastRequestTime for a rolling window
            otpRecord.lastRequestTime = now;
        } else {
            // If no record exists, create a new one
            otpRecord = new OTP({
                mobile,
                requestCount: 1,
                lastRequestTime: now
            });
        }
        
        // Generate and update the OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        otpRecord.otp = otp;
        otpRecord.createdAt = now; // Ensure createdAt is updated for a new OTP
        await otpRecord.save();

        // Prepare the SMS body
        const body = `Your OTP for Fincash verification is valid for ${validity} minutes, please don't share. OTP: ${otp}`;
        
        // Send the SMS via Kaleyra API
        await axios.post(
            `${baseUrl}/v2/${sid}/messages`,
            {
                to: mobile,
                sender,
                "type": "OTP",
                "channel": "SMS",
                "template_id": templateId,
                "body": body
            },
            {
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`✅ OTP ${otp} sent to ${mobile}`);
        res.status(200).json({
            message: "OTP sent successfully. Please check your mobile for the code.",
            status: "SUCCESS"
        });

    } catch (err) {
        console.error("❌ API error:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to send OTP.", details: err.response?.data || err.message });
    }
});

// Endpoint to verify OTP
router.post('/verify_otp', async (req, res) => {
    const { mobile, user_otp } = req.body;

    if (!mobile || !user_otp) {
        return res.status(400).json({ error: "Mobile number and OTP are required." });
    }

    try {
        // Find the stored OTP in the database
        const storedOtp = await OTP.findOne({ mobile: mobile });
        const now = new Date();
        const validityInMinutes = validity; // Use the shared constant

        if (!storedOtp) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Check if the OTP has expired
        const timeElapsed = (now - storedOtp.createdAt) / (1000 * 60); // Time in minutes
        if (timeElapsed > validityInMinutes) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Check if the OTP is already used or is null
        if (storedOtp.otp === null) {
            return res.status(400).json({ message: "This OTP has already been used." });
        }

        if (storedOtp.otp === user_otp) {
            // If OTP matches, invalidate it by setting the otp field to null
            storedOtp.otp = null;
            await storedOtp.save();
            
            return res.status(200).json({ message: "OTP verified successfully." });
        } else {
            // If OTP does not match
            return res.status(400).json({ message: "Invalid OTP." });
        }

    } catch (err) {
        console.error("❌ Verification error:", err.message);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

module.exports = router;
