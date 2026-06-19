// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const guardRoutes = require('./routes/guards');
const shiftLogRoutes = require('./routes/shiftLogs');
const venueRoutes = require('./routes/venues');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/guards', guardRoutes);
app.use('/shift-logs', shiftLogRoutes);
app.use('/venues', venueRoutes);
app.use('/users', userRoutes);

// Basic error handler for anything that slips through
app.use((err, req, res, next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Security clock app backend running on port ${PORT}`);
});
