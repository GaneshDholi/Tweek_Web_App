const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth');
const cors = require("cors");
const connectDB = require('./config/db');
const Tasks = require("./routes/Tasks");
const calendarRoutes = require('./routes/calendar'); 
const dotenv = require('dotenv');
dotenv.config();
const allowedOrigins = [
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1:3000"
];

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for this origin: " + origin));
    }
  },
  credentials: true
}));


// Connect to MongoDB
connectDB();

app.get('/profile', authMiddleware, (req, res) => {
  // authMiddleware attaches the user object to the request
  res.json({ message: "Welcome to your profile!", user: req.user });
});

// Basic health check route
app.get('/', (req, res) => res.send('Authentication server is up and running'));

// Authentication routes
app.use('/auth', authRoutes);

// task api
app.use("/api/tasks", authMiddleware, Tasks);
app.use("/api/calendars", authMiddleware, calendarRoutes);
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

