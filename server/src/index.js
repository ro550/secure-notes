
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(generalLimiter);
app.use(express.json({ limit: '50kb' }));

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});