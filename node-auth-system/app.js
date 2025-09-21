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

// --- START: CORS CONFIGURATION ---

// Add all URLs that your frontend will run on.
const allowedOrigins = [
  "https://tweek-web-app-two.vercel.app", // Your deployed Vercel URL
  "http://127.0.0.1:5501",               // Your local development URL
  "http://localhost:5501"                // Another common local URL
];

// If you have a CLIENT_URL in your .env, you can add it too:
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  // The origin function checks if the incoming request origin is in our allowed list.
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS. Origin: " + origin));
    }
  },
  credentials: true, // This is important for sending cookies
};

const app = express();

// --- MIDDLEWARE SETUP ---

// Use the single, consolidated CORS configuration HERE, before all your routes.
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// --- END: CORS CONFIGURATION & MIDDLEWARE ---


// Connect to MongoDB
connectDB();

// --- ROUTES ---

app.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: "Welcome to your profile!", user: req.user });
});

app.get('/', (req, res) => res.send('Authentication server is up and running'));

app.use('/auth', authRoutes);
app.use("/api/tasks", authMiddleware, Tasks);
app.use("/api/calendars", authMiddleware, calendarRoutes);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the full error
  // If it's a CORS error from our config, send a specific message
  if (err.message.startsWith("Not allowed by CORS")) {
      return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
