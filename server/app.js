// Load environment variables first
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Keep-alive endpoint to prevent Render from sleeping
app.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is awake',
        timestamp: new Date().toISOString()
    });
});

// Routes
const routes = require('./routes');
app.use('/api', upload.single('file'), routes);

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});