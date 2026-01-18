const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB = require('./utils/db');
const { handleCors, successResponse, errorResponse } = require('./utils/middleware');

// Import User model
const User = require('../../backend/models/User');

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event, context) => {
    // Handle CORS
    const corsResponse = handleCors(event);
    if (corsResponse) return corsResponse;

    // Connect to database
    try {
        await connectDB();
    } catch (error) {
        return errorResponse('Database connection failed', 500);
    }

    // Parse path and method
    const path = event.path.replace('/.netlify/functions/auth', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    try {
        // POST /signup
        if (method === 'POST' && path === '/signup') {
            const { username, email, password, gender, age, dob, workingStatus } = body;

            if (!username || !email || !password || !gender || !age || !dob || !workingStatus) {
                return errorResponse('All fields are required', 400);
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return errorResponse('User already exists', 400);
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

            return successResponse({ message: 'User registered successfully', token }, 201);
        }

        // POST /login
        if (method === 'POST' && path === '/login') {
            const { email, password } = body;

            if (!email || !password) {
                return errorResponse('Email and password are required', 400);
            }

            const user = await User.findOne({ email });
            if (!user) {
                return errorResponse('User not found', 404);
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return errorResponse('Invalid credentials', 401);
            }

            const payload = {
                user: {
                    id: user._id,
                },
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

            return successResponse({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                },
            });
        }

        // GET /by-email/:email
        if (method === 'GET' && path.startsWith('/by-email/')) {
            const email = path.replace('/by-email/', '');
            const user = await User.findOne({ email });

            if (user) {
                return successResponse({ user_id: user._id });
            } else {
                return errorResponse('User not found', 404);
            }
        }

        // GET /by-profile/:id
        if (method === 'GET' && path.startsWith('/by-profile/')) {
            const id = path.replace('/by-profile/', '');
            const user = await User.findById(id);

            if (user) {
                return successResponse(user);
            } else {
                return errorResponse('User not found', 404);
            }
        }

        // PUT /update/:email
        if (method === 'PUT' && path.startsWith('/update/')) {
            const email = path.replace('/update/', '');
            const updatedData = body;

            delete updatedData.email;
            delete updatedData.password;

            const user = await User.findOneAndUpdate(
                { email: email },
                { $set: updatedData },
                { new: true, runValidators: true }
            );

            if (!user) {
                return errorResponse('User not found', 404);
            }

            return successResponse({ message: 'Profile updated successfully', user });
        }

        // Route not found
        return errorResponse('Route not found', 404);

    } catch (error) {
        console.error('Auth function error:', error);
        return errorResponse(error.message || 'Internal server error', 500);
    }
};
