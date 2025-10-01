


// This file defines the API routes for authentication and proxy credentials.
// routes/proxyRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./authMiddleware'); // Import the new middleware

// WARNING: Use an environment variable for a production app
const JWT_SECRET = 'rescale@123'; 

const BACKEND_SERVICE_CLIENT_ID = 'rescale.admin';
const BACKEND_SERVICE_CLIENT_SECRET = 'rescale.admin123';



const PROXY_HOST = 'pr.oxylabs.io';
const PROXY_PORT = 7777;
const PROXY_USER = 'customer-ytdeiusfie_grHwT-cc-IN';
const PROXY_PASS = '==44dewfoewfoif';

/**
 * Endpoint for a backend service to obtain a JWT.
 */
router.post('/login', (req, res) => {
    const { clientId, clientSecret } = req.body;

    if (clientId === BACKEND_SERVICE_CLIENT_ID && clientSecret === BACKEND_SERVICE_CLIENT_SECRET) {
        const token = jwt.sign({ clientId: BACKEND_SERVICE_CLIENT_ID }, JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

/**
 * Protected endpoint to provide proxy credentials.
 * It uses the 'authenticateToken' middleware to ensure a valid JWT is present.
 */
router.get('/proxy', authenticateToken, (req, res) => {
    const credentials = {
        host: PROXY_HOST,
        port: PROXY_PORT,
        username: PROXY_USER,
        password: PROXY_PASS
    };
    res.status(200).json(credentials);
});

module.exports = router;
