const express = require('express');
const { signup, login, getUserByEmail, getUserById, updateUser } = require('../controllers/authController');

const router = express.Router();

// Signup Route
router.post('/signup', signup);

// Login Route
router.post('/login', login);

// Fetch User by Email Route
router.get('/by-email/:email', getUserByEmail);

// User by Profile (ID) Route
router.get('/by-profile/:id', getUserById);

// Update User Route
router.put('/update/:email', updateUser);

module.exports = router;