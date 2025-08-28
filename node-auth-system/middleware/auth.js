const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by ID from token and attach to request, excluding the password
        const user = await User.findById(decoded.sub).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = user; // Attach user object to the request
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;