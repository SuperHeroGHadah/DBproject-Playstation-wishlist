const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// load env vars
dotenv.config();

// connect to the db
connectDB();

const app = express();

// initialize the security middlewares
app.use(helmet()); // security headers
app.use(cors()); // Enable CORS to make sure the frontend is able to access

// rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // each ip can only make 100 requests in 10 mins
  message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

// parse message bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authroutes');
const userRoutes = require('./routes/usersroutes');
const gameRoutes = require('./routes/gamesroutes');
const reviewRoutes = require('./routes/reviewsroutes');
const activityRoutes = require('./routes/activitiesroutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/activities', activityRoutes);

// quick endpoint for checking if cnnection worked (only for develpment)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PlayStation Wishlist API is running',
    timestamp: new Date().toISOString(),
  });
});

// HTTP error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // if in dev we include stakc trace
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000; // either the prot in env or default to 5000

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
