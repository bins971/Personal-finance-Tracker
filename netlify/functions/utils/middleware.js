// Middleware utilities for Netlify Functions
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// CORS headers for all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Handle CORS preflight requests
const handleCors = (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }
    return null;
};

// JWT Authentication middleware
const authenticate = (event) => {
    try {
        const authHeader = event.headers.authorization || event.headers.Authorization;

        if (!authHeader) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'No authorization header' }),
            };
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'No token provided' }),
            };
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        return { user: decoded.user };
    } catch (error) {
        return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Invalid token' }),
        };
    }
};

// Success response helper
const successResponse = (data, statusCode = 200) => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
});

// Error response helper
const errorResponse = (message, statusCode = 500) => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ message }),
});

module.exports = {
    corsHeaders,
    handleCors,
    authenticate,
    successResponse,
    errorResponse,
};
