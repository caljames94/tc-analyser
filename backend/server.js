require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const logger = require('./utils/logger');
const analyzeRoutes = require('./routes/analyzeRoutes');
const representativeRoutes = require('./routes/representativeRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.EXTENSION_URL,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/representatives', representativeRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

// MongoDB connection (optional)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info('MongoDB connected...'))
  .catch((err) => logger.error('MongoDB connection error:', err));
}

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});