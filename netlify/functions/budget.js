// Budget Serverless Function
// Handles: /api/budget/create, /api/budget/update/:id, /api/budget/fetch/:userId, /api/budget/history/:userId

const connectDB = require('./utils/db');
const { handleCors, successResponse, errorResponse } = require('./utils/middleware');

// Import models
const Budget = require('../../backend/models/Budget');
const User = require('../../backend/models/User');
const Expense = require('../../backend/models/Expense');
const BudgetHistory = require('../../backend/models/BudgetHistory');
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
    const path = event.path.replace('/.netlify/functions/budget', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    try {
        // POST /create
        if (method === 'POST' && path === '/create') {
            const { user: userId, totalAmount, currentAmount, startDate, endDate } = body;

            const user = await User.findById(userId);
            if (!user) {
                return errorResponse('User not found', 404);
            }

            // ARCHIVAL LOGIC
            const existingBudget = await Budget.findOne({ user: userId });
            if (existingBudget) {
                const expenses = await Expense.find({ user: userId });
                const subscriptions = await Subscription.find({ user: userId });

                let archivedExpenses = expenses.map(e => ({
                    category: e.category,
                    name: e.name,
                    amount: e.amount,
                    date: e.date,
                    description: e.description
                }));

                // Add subscription virtual transactions to history
                const start = new Date(existingBudget.startDate);
                const end = new Date(existingBudget.endDate);

                subscriptions.forEach(sub => {
                    if (sub.cycle === 'Monthly') {
                        let temp = new Date(start);
                        while (temp <= end) {
                            const subDate = new Date(temp.getFullYear(), temp.getMonth(), new Date(sub.startDate).getDate());
                            if (subDate >= start && subDate <= end) {
                                archivedExpenses.push({
                                    category: sub.category || 'Subscription',
                                    name: `${sub.name} (Subscription)`,
                                    amount: sub.amount,
                                    date: subDate,
                                    description: `Recurring ${sub.cycle} payment`
                                });
                            }
                            temp.setMonth(temp.getMonth() + 1);
                        }
                    } else if (sub.cycle === 'Yearly') {
                        const subStart = new Date(sub.startDate);
                        const subDate = new Date(start.getFullYear(), subStart.getMonth(), subStart.getDate());
                        if (subDate >= start && subDate <= end) {
                            archivedExpenses.push({
                                category: sub.category || 'Subscription',
                                name: `${sub.name} (Subscription)`,
                                amount: sub.amount,
                                date: subDate,
                                description: `Recurring ${sub.cycle} payment`
                            });
                        }
                    }
                });

                const history = new BudgetHistory({
                    user: userId,
                    totalAmount: existingBudget.totalAmount,
                    remainingAmount: existingBudget.currentAmount,
                    startDate: existingBudget.startDate,
                    endDate: existingBudget.endDate,
                    expenses: archivedExpenses,
                    achievement: (existingBudget.currentAmount / existingBudget.totalAmount * 100 >= 85 && existingBudget.currentAmount / existingBudget.totalAmount * 100 <= 90)
                        ? "Frugal Master" : null
                });
                await history.save();

                // Reset: Remove old budget and expenses
                await Budget.deleteOne({ _id: existingBudget._id });
                await Expense.deleteMany({ user: userId });
            }

            const budget = new Budget({
                user,
                totalAmount,
                currentAmount: totalAmount,
                startDate,
                endDate,
            });
            await budget.save();
            return successResponse({ message: 'Budget set and data reset successfully!', budget }, 201);
        }

        // PUT /update/:id
        if (method === 'PUT' && path.startsWith('/update/')) {
            const userId = path.replace('/update/', '');
            const { totalAmount, startDate, endDate } = body;
            const existingBudget = await Budget.findOne({ user: userId });

            if (!existingBudget) {
                return errorResponse('Budget not found', 404);
            }

            // ARCHIVAL LOGIC
            const expenses = await Expense.find({ user: userId });
            const subscriptions = await Subscription.find({ user: userId });

            let archivedExpenses = expenses.map(e => ({
                category: e.category,
                name: e.name,
                amount: e.amount,
                date: e.date,
                description: e.description
            }));

            // Add subscription virtual transactions to history
            const start = new Date(existingBudget.startDate);
            const end = new Date(existingBudget.endDate);

            subscriptions.forEach(sub => {
                if (sub.cycle === 'Monthly') {
                    let temp = new Date(start);
                    while (temp <= end) {
                        const subDate = new Date(temp.getFullYear(), temp.getMonth(), new Date(sub.startDate).getDate());
                        if (subDate >= start && subDate <= end) {
                            archivedExpenses.push({
                                category: sub.category || 'Subscription',
                                name: `${sub.name} (Subscription)`,
                                amount: sub.amount,
                                date: subDate,
                                description: `Recurring ${sub.cycle} payment`
                            });
                        }
                        temp.setMonth(temp.getMonth() + 1);
                    }
                } else if (sub.cycle === 'Yearly') {
                    const subStart = new Date(sub.startDate);
                    const subDate = new Date(start.getFullYear(), subStart.getMonth(), subStart.getDate());
                    if (subDate >= start && subDate <= end) {
                        archivedExpenses.push({
                            category: sub.category || 'Subscription',
                            name: `${sub.name} (Subscription)`,
                            amount: sub.amount,
                            date: subDate,
                            description: `Recurring ${sub.cycle} payment`
                        });
                    }
                }
            });

            const remainingPercent = (existingBudget.currentAmount / existingBudget.totalAmount) * 100;
            let achievement = null;
            if (remainingPercent >= 30) achievement = "🥇 Gold Medal";
            else if (remainingPercent >= 15) achievement = "🥈 Silver Medal";
            else if (remainingPercent >= 5) achievement = "🥉 Bronze Medal";
            else achievement = "✅ Budget Finisher";

            const history = new BudgetHistory({
                user: userId,
                totalAmount: existingBudget.totalAmount,
                remainingAmount: existingBudget.currentAmount,
                startDate: existingBudget.startDate,
                endDate: existingBudget.endDate,
                expenses: archivedExpenses,
                achievement: achievement
            });
            await history.save();

            // Reset: Clear expenses for the new budget period
            await Expense.deleteMany({ user: userId });

            // Update the budget to new values
            if (totalAmount) {
                existingBudget.totalAmount = totalAmount;
                existingBudget.currentAmount = totalAmount;
            }
            if (startDate) existingBudget.startDate = startDate;
            if (endDate) existingBudget.endDate = endDate;

            await existingBudget.save();
            return successResponse({ message: 'Budget reset and history saved!', budget: existingBudget });
        }

        // GET /fetch/:userId
        if (method === 'GET' && path.startsWith('/fetch/')) {
            const userId = path.replace('/fetch/', '');
            const budget = await Budget.findOne({ user: userId });

            if (budget) {
                const subscriptions = await Subscription.find({ user: userId });

                let subscriptionTotal = 0;
                const start = new Date(budget.startDate);
                const end = new Date(budget.endDate);
                const today = new Date();

                subscriptions.forEach(sub => {
                    if (sub.cycle === 'Monthly') {
                        let temp = new Date(start);
                        while (temp <= end) {
                            const subDate = new Date(temp.getFullYear(), temp.getMonth(), new Date(sub.startDate).getDate());
                            if (subDate >= start && subDate <= end && subDate <= today) subscriptionTotal += sub.amount;
                            temp.setMonth(temp.getMonth() + 1);
                        }
                    } else if (sub.cycle === 'Yearly') {
                        const subStart = new Date(sub.startDate);
                        const subDate = new Date(start.getFullYear(), subStart.getMonth(), subStart.getDate());
                        if (subDate >= start && subDate <= end && subDate <= today) subscriptionTotal += sub.amount;
                    }
                });

                return successResponse({
                    totalAmount: budget.totalAmount,
                    currentAmount: Math.max(0, budget.currentAmount - subscriptionTotal),
                    startdate: budget.startDate,
                    enddate: budget.endDate
                });
            } else {
                return errorResponse('User budget not found', 404);
            }
        }

        // GET /history/:userId
        if (method === 'GET' && path.startsWith('/history/')) {
            const userId = path.replace('/history/', '');
            const history = await BudgetHistory.find({ user: userId }).sort({ archivedDate: -1 });
            return successResponse(history);
        }

        // Route not found
        return errorResponse('Route not found', 404);

    } catch (error) {
        console.error('Budget function error:', error);
        return errorResponse(error.message || 'Internal server error', 500);
    }
};
