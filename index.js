const express = require('express');
const cors = require('cors');

require('./db'); // Automatically connects and logs
const otpRoutes = require('./routes/otpRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes'); 

const proxyRoutes = require('./routes/proxyRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/api', otpRoutes);
app.use('/api', whatsappRoutes); 

app.use('/api', proxyRoutes);

const server = app.listen(PORT);

server.on('listening', () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill the previous process or use a different port.`);
    } else {
        console.error(`❌ Server error: ${err.message}`);
    }
    process.exit(1);
});

exports.app = app;