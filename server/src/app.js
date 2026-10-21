// server/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// app.set('trust proxy', 1); // enable when deployed behind a reverse proxy

app.use(helmet());
app.use(cors({ origin: config.CLIENT_URL }));
app.use(generalLimiter); // after CORS so 429s still carry CORS headers
app.use(express.json({ limit: '50kb' }));

// Stricter limits on credential endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// (routes are mounted here in later commits)

app.use(notFound);
app.use(errorHandler);

module.exports = app;