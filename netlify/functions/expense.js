// Expense Serverless Function
// Handles all expense-related operations

const mongoose = require('mongoose');
const connectDB = require('./utils/db');
const { handleCors, successResponse, errorResponse } = require('./utils/middleware');

// Import models
const Expense = require('../../backend/models/Expense');
const Budget = require('../../backend/models/Budget');
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
    const path = event.path.replace('/.netlify/functions/expense', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};

    try {
        // POST /add
        if (method === 'POST' && path === '/add') {
            const { user, category, name, amount, date, description } = body;

            const newExpense = new Expense({
                user,
                category,
                name,
                amount,
                date,
                description,
            });

            const budget = await Budget.findOne({ user: user });
            if (!budget) {
                return errorResponse("No budget found for this user", 404);
            }

            if (budget.currentAmount < amount) {
                return errorResponse("Insufficient budget for this expense", 400);
            }

            await newExpense.save();
            budget.currentAmount -= amount;
            await budget.save();

            return successResponse({
                message: "Expense added and budget updated!",
                expense: newExpense,
            }, 201);
        }

        // GET /daily-expenses/:userId
        if (method === 'GET' && path.startsWith('/daily-expenses/')) {
            const userId = path.replace('/daily-expenses/', '');
            const budget = await Budget.findOne({ user: userId });

            if (!budget) {
                return errorResponse('Budget not found for the user', 404);
            }

            const { startDate, endDate } = budget;
            const subscriptions = await Subscription.find({ user: userId });

            const dailyExpensesQuery = await Expense.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$date' },
                        },
                        totalAmount: { $sum: '$amount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            const dailyMap = dailyExpensesQuery.reduce((acc, curr) => {
                acc[curr._id] = curr.totalAmount;
                return acc;
            }, {});

            const start = new Date(startDate);
            const end = new Date(endDate);

            subscriptions.forEach(sub => {
                if (sub.cycle === 'Monthly') {
                    let temp = new Date(start);
                    while (temp <= end) {
                        const subDate = new Date(temp.getFullYear(), temp.getMonth(), new Date(sub.startDate).getDate());
                        if (subDate >= start && subDate <= end) {
                            const dateStr = subDate.toISOString().split('T')[0];
                            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + sub.amount;
                        }
                        temp.setMonth(temp.getMonth() + 1);
                    }
                } else if (sub.cycle === 'Yearly') {
                    let temp = new Date(start);
                    const subStart = new Date(sub.startDate);
                    const subDate = new Date(temp.getFullYear(), subStart.getMonth(), subStart.getDate());
                    if (subDate >= start && subDate <= end) {
                        const dateStr = subDate.toISOString().split('T')[0];
                        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + sub.amount;
                    }
                }
            });

            const dailyExpenses = Object.keys(dailyMap).sort().map(date => ({
                _id: date,
                totalAmount: dailyMap[date]
            }));

            return successResponse({
                user: userId,
                budgetPeriod: { startDate, endDate },
                dailyExpenses,
            });
        }

        // GET /all/:user
        if (method === 'GET' && path.startsWith('/all/')) {
            const userId = path.replace('/all/', '');
            const budget = await Budget.findOne({ user: userId });

            let query = { user: userId };
            if (budget) {
                query.date = { $gte: new Date(budget.startDate), $lte: new Date(budget.endDate) };
            }

            let expenses = await Expense.find(query).sort({ date: -1 }).lean();

            const subscriptions = await Subscription.find({ user: userId });

            if (budget) {
                const start = new Date(budget.startDate);
                const end = new Date(budget.endDate);
                const today = new Date();

                subscriptions.forEach(sub => {
                    if (sub.cycle === 'Monthly') {
                        let temp = new Date(start);
                        while (temp <= end) {
                            const subDate = new Date(temp.getFullYear(), temp.getMonth(), new Date(sub.startDate).getDate());
                            if (subDate >= start && subDate <= end && subDate <= today) {
                                expenses.push({
                                    _id: `sub-${sub._id}-${subDate.getTime()}`,
                                    user: sub.user,
                                    category: sub.category || 'Subscription',
                                    name: `${sub.name} (Subscription)`,
                                    amount: sub.amount,
                                    date: subDate,
                                    description: `Recurring ${sub.cycle} payment`,
                                    isSubscription: true
                                });
                            }
                            temp.setMonth(temp.getMonth() + 1);
                        }
                    } else if (sub.cycle === 'Yearly') {
                        const subStart = new Date(sub.startDate);
                        const subDate = new Date(start.getFullYear(), subStart.getMonth(), subStart.getDate());
                        if (subDate >= start && subDate <= end && subDate <= today) {
                            expenses.push({
                                _id: `sub-${sub._id}-${subDate.getTime()}`,
                                user: sub.user,
                                category: sub.category || 'Subscription',
                                name: `${sub.name} (Subscription)`,
                                amount: sub.amount,
                                date: subDate,
                                description: `Recurring ${sub.cycle} payment`,
                                isSubscription: true
                            });
                        }
                    }
                });
            }

            expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

            return successResponse({
                message: "Expenses fetched successfully!",
                expenses,
            });
        }

        // GET /category-percentage/:user
        if (method === 'GET' && path.startsWith('/category-percentage/')) {
            const userId = path.replace('/category-percentage/', '');
            const budget = await Budget.findOne({ user: userId });

            let query = { user: userId };
            if (budget) {
                query.date = { $gte: new Date(budget.startDate), $lte: new Date(budget.endDate) };
            }

            const expenses = await Expense.find(query).lean();
            const subscriptions = await Subscription.find({ user: userId });

            const categorySums = expenses.reduce((acc, expense) => {
                if (!acc[expense.category]) acc[expense.category] = 0;
                acc[expense.category] += expense.amount;
                return acc;
            }, {});

            if (budget) {
                const start = new Date(budget.startDate);
                const end = new Date(budget.endDate);
                const today = new Date();

                subscriptions.forEach(sub => {
                    let count = 0;
                    if (sub.cycle === 'Monthly') {
                        let temp = new Date(start);
                        while (temp <= end) {
                            const subDate = new Date(temp.getFullYear(), temp.getMonth(), new Date(sub.startDate).getDate());
                            if (subDate >= start && subDate <= end && subDate <= today) count++;
                            temp.setMonth(temp.getMonth() + 1);
                        }
                    } else if (sub.cycle === 'Yearly') {
                        const subStart = new Date(sub.startDate);
                        const subDate = new Date(start.getFullYear(), subStart.getMonth(), subStart.getDate());
                        if (subDate >= start && subDate <= end && subDate <= today) count++;
                    }

                    if (count > 0) {
                        const category = sub.category || 'Subscription';
                        if (!categorySums[category]) categorySums[category] = 0;
                        categorySums[category] += sub.amount * count;
                    }
                });
            }

            const totalAmount = Object.values(categorySums).reduce((total, amt) => total + amt, 0);

            const categoryPercentages = Object.keys(categorySums).map(category => {
                const categoryAmount = categorySums[category];
                const percentage = totalAmount > 0 ? (categoryAmount / totalAmount) * 100 : 0;
                return { category, amount: categoryAmount, percentage: percentage.toFixed(2) };
            });

            return successResponse({
                message: "Category percentages calculated successfully!",
                categoryPercentages,
            });
        }

        // GET /duration/:user
        if (method === 'GET' && path.startsWith('/duration/')) {
            const userId = path.replace('/duration/', '');
            const { startDate, endDate } = queryParams;

            if (!startDate || !endDate) {
                return errorResponse("Please provide both startDate and endDate in query parameters", 400);
            }

            const expenses = await Expense.find({
                user: userId,
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            });

            if (!expenses.length) {
                return errorResponse("No expenses found for the specified duration", 404);
            }

            return successResponse({
                message: "Expenses for the specified duration fetched successfully!",
                expenses,
            });
        }

        // PUT /edit/:id
        if (method === 'PUT' && path.startsWith('/edit/')) {
            const id = path.replace('/edit/', '');
            const updateData = body;

            const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, { new: true });

            if (!updatedExpense) {
                return errorResponse("Expense not found", 404);
            }

            return successResponse({
                message: "Expense updated successfully!",
                expense: updatedExpense,
            });
        }

        // DELETE /delete/:id
        if (method === 'DELETE' && path.startsWith('/delete/')) {
            const id = path.replace('/delete/', '');
            const expense = await Expense.findById(id);

            if (!expense) {
                return errorResponse("Expense not found", 404);
            }

            const budget = await Budget.findOne({ user: expense.user });
            if (budget) {
                budget.currentAmount += expense.amount;
                await budget.save();
            }

            await Expense.findByIdAndDelete(id);

            return successResponse({ message: "Expense deleted successfully!" });
        }

        // Route not found
        return errorResponse('Route not found', 404);

    } catch (error) {
        console.error('Expense function error:', error);
        return errorResponse(error.message || 'Internal server error', 500);
    }
};
