const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect MongoDB
connectDB();

// ======================
// CORS
// ======================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://maintaince-tracker.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS Not Allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ======================
// BODY PARSER
// ======================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ======================
// ROUTES
// ======================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/wings', require('./routes/wings'));
app.use('/api/flats', require('./routes/flats'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/export', require('./routes/export'));
app.use('/api/trash', require('./routes/trash'));
app.use('/api/audit', require('./routes/audit'));

// ======================
// HEALTH ROUTE
// ======================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Running Successfully'
  });
});

// ======================
// ERROR HANDLER
// ======================

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ======================
// 404
// ======================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ======================
// SERVER
// ======================

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
