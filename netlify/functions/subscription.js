// Subscription Serverless Function
// Handles subscription management

const connectDB = require('./utils/db');
const { handleCors, successResponse, errorResponse } = require('./utils/middleware');

// Import models
const Subscription = require('../../backend/models/Subscription');

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
    const path = event.path.replace('/.netlify/functions/subscription', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    try {
        // POST /add
        if (method === 'POST' && path === '/add') {
            const { user, name, amount, cycle, startDate } = body;

            const newSubscription = new Subscription({
                user,
                name,
                amount,
                cycle,
                category: body.category || 'Subscription',
                startDate
            });

            const savedSubscription = await newSubscription.save();
            return successResponse(savedSubscription, 201);
        }

        // GET /:userId
        if (method === 'GET' && path.startsWith('/') && path !== '/') {
            const userId = path.replace('/', '');
            const subscriptions = await Subscription.find({ user: userId }).sort({ nextPaymentDate: 1 });
            return successResponse(subscriptions);
        }

        // DELETE /:id
        if (method === 'DELETE' && path.startsWith('/')) {
            const id = path.replace('/', '');
            await Subscription.findByIdAndDelete(id);
            return successResponse({ message: "Subscription Deleted" });
        }

        // Route not found
        return errorResponse('Route not found', 404);

    } catch (error) {
        console.error('Subscription function error:', error);
        return errorResponse(error.message || 'Server Error', 500);
    }
};
