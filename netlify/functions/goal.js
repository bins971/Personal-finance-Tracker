// Goal Serverless Function
// Handles all goal-related operations

const connectDB = require('./utils/db');
const { handleCors, successResponse, errorResponse } = require('./utils/middleware');

// Import models
const Goal = require('../../backend/models/Goal');
const User = require('../../backend/models/User');

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
    const path = event.path.replace('/.netlify/functions/goal', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    try {
        // POST /create
        if (method === 'POST' && path === '/create') {
            const user = await User.findById(body.user);
            if (!user) {
                return errorResponse('User not found', 404);
            }

            const goal = new Goal(body);
            await goal.save();
            return successResponse(goal, 201);
        }

        // POST /create-user-goal
        if (method === 'POST' && path === '/create-user-goal') {
            const { email, name, amount, saved, description, startDate, endDate } = body;

            const user = await User.findOne({ email });
            if (!user) {
                return errorResponse('User not found', 404);
            }

            const goal = new Goal({
                user: user._id,
                name,
                amount,
                saved,
                description,
                startDate,
                endDate,
            });

            await goal.save();
            return successResponse({ message: 'Goal created successfully!', goal }, 201);
        }

        // GET /by-email/:email
        if (method === 'GET' && path.startsWith('/by-email/')) {
            const email = path.replace('/by-email/', '');
            const user = await User.findOne({ email });
            if (!user) {
                return errorResponse('User not found', 404);
            }

            const goals = await Goal.find({ user: user._id });
            return successResponse(goals);
        }

        // PUT /update-saved/:id
        if (method === 'PUT' && path.startsWith('/update-saved/')) {
            const id = path.replace('/update-saved/', '');
            const goal = await Goal.findById(id);
            if (!goal) {
                return errorResponse('Goal not found', 404);
            }

            const { saved } = body;
            if (saved !== undefined) {
                goal.saved += saved;
            }

            await goal.save();
            return successResponse(goal);
        }

        // PUT /update/:id
        if (method === 'PUT' && path.startsWith('/update/')) {
            const id = path.replace('/update/', '');
            const { saved, amount } = body;
            const goal = await Goal.findById(id);
            if (!goal) {
                return errorResponse('Goal not found', 404);
            }

            goal.saved = saved !== undefined ? saved : goal.saved;
            goal.amount = amount !== undefined ? amount : goal.amount;
            await goal.save();

            return successResponse({ message: 'Goal updated successfully!', goal });
        }

        // DELETE /delete/:id
        if (method === 'DELETE' && path.startsWith('/delete/')) {
            const id = path.replace('/delete/', '');
            const goal = await Goal.findByIdAndDelete(id);

            if (!goal) {
                return errorResponse("Goal not found", 404);
            }

            return successResponse({ message: "Goal deleted successfully!" });
        }

        // Route not found
        return errorResponse('Route not found', 404);

    } catch (error) {
        console.error('Goal function error:', error);
        return errorResponse(error.message || 'Internal server error', 500);
    }
};
