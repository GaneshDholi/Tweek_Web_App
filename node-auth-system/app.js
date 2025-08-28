require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth');
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(cors({
  origin: "http://127.0.0.1:5501",
  credentials: true
}));


// Connect mongo
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Mongo connected'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

// for profile
app.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: "Welcome!", user: req.user });
});

// Basic health route
app.get('/', (req, res) => res.send('OTP auth server is running'));

// Auth routes
app.use('/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});


app.post('/auth/logout', (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
