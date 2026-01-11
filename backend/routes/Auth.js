const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fetchUser = require('../middleware/fetchUser'); 

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; 

// Signup Route
router.post('/signup', async (req, res) => {
  const { username, email, password, gender, age, dob, workingStatus } = req.body;

  try {
     if (!username || !email || !password || !gender || !age || !dob || !workingStatus) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
  username,
  email,
  password: hashedPassword,
  gender,
  age: Number(age), 
  dob: new Date(dob),
  workingStatus: workingStatus.trim() || '',
});

    await newUser.save();
    const payload = {
      user: {
        id: newUser._id,  
        username: newUser.username,

      },
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token }); 
  }
  catch (error) {
  console.error('Signup error:', error);
  return res.status(400).json({
    message: error.message,
    validationErrors: error.errors
  });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
     if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const payload = {
      user: {
        id: user._id, 
      },
    };
    // console.log(id)
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Fetch User by Email Route
router.get('/by-email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (user) {
      return res.json({ user_id: user._id }); // Return the user_id
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/by-profile/:profile', async (req, res) => {
  console.log("&&&&&&&&&&&&&&&&11111")
  try {
    const {id}=req.params
    console.log(id)
    const user = await User.findById(id); // Query by ID
    if (user) {
      return res.json(user); // Return the user_id
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});
router.put('/update/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const updatedData = req.body;

    console.log('Update Route Triggered for:', email);
    console.log('Payload Received:', updatedData);

  
    delete updatedData.email;
    delete updatedData.password;

    const user = await User.findOneAndUpdate(
      { email: email },       
      { $set: updatedData },  
      { new: true, runValidators: true } 
    );

    if (!user) {
      console.log('No user found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated User:', user);
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate email detected' });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;