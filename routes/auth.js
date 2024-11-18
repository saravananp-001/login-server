const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middlewares/authMiddleware.js')

require('dotenv').config();
const router = express.Router();

// Signup
router.post('/signup',async (req, res)=>{
    const {name, email, password } = req.body;

    try {
        //Check if the user already exists
        const existingUser = await User.findOne({email});

        console.log('existingUser',existingUser);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a User
        const newUser = new User({name, email, password});
        await newUser.save();

        res.status(201).json({message:'User created successfully'});
    }catch(err){
        res.status(500).json({ message: 'Server error', error: err.message });
    }

});

// Login
router.post('/login',async (req, res)=>{
    const { email, password } = req.body;

    try {
        //Check if the user already exists
        const user = await User.findOne({email});
        console.log('user details (login) from DB', user);
        
        if (!user) {
            return res.status(404).json({ message: 'User not exists' });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('isMatch',isMatch);

        // Generate a JWT token
        const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', accessToken:token });

    }catch(err){
        res.status(500).json({ message: 'Server error', error: err.message });
    }

})

// Example protected route
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id }).select('-password'); // Exclude password
        console.log('user details (profile) from DB', user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile details retrieved successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;