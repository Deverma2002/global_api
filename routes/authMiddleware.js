// routes/authMiddleware.js
const jwt = require('jsonwebtoken');

// WARNING: Use an environment variable for a production app
const JWT_SECRET = 'rescale@123';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Authentication token not provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, service) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.service = service;
        next();
    });
};

module.exports = { authenticateToken };