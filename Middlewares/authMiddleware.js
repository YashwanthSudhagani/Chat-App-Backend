// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Assuming you have a User model

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user.role = user.role; // Assuming role is stored in the user model
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
