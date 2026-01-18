// Advisor Serverless Function
// Handles AI financial advisor and forecast

const connectDB = require('./utils/db');
const { handleCors, successResponse, errorResponse } = require('./utils/middleware');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Import models
const Budget = require('../../backend/models/Budget');
const Expense = require('../../backend/models/Expense');
const Goal = require('../../backend/models/Goal');
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
    const path = event.path.replace('/.netlify/functions/advisor', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    try {
        // POST /advice
        if (method === 'POST' && path === '/advice') {
            const { userId } = body;

            if (!process.env.GEMINI_API_KEY) {
                console.error('GEMINI_API_KEY is missing');
                return errorResponse('AI configuration error: Missing API Key', 500);
            }

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

            if (!userId) {
                return errorResponse('User ID is required', 400);
            }

            const budget = await Budget.findOne({ user: userId });
            const expenses = await Expense.find({ user: userId });
            const goals = await Goal.find({ user: userId });

            if (!budget) {
                return successResponse({
                    advice: "It looks like you haven't set a budget yet. Setting a budget is the first step to financial freedom! Go to the Budget section to get started."
                });
            }

            const totalBudget = budget.totalAmount;
            const currentBalance = budget.currentAmount;
            const totalExpenses = totalBudget - currentBalance;
            const burnRate = ((totalExpenses / totalBudget) * 100).toFixed(2);

            const subscriptions = await Subscription.find({ user: userId });
            const monthlySubTotal = subscriptions.reduce((acc, sub) => {
                return acc + (sub.cycle === 'Monthly' ? sub.amount : sub.amount / 12);
            }, 0);

            const expenseByCategory = {};
            expenses.forEach(exp => {
                if (expenseByCategory[exp.category]) {
                    expenseByCategory[exp.category] += exp.amount;
                } else {
                    expenseByCategory[exp.category] = exp.amount;
                }
            });

            const sortedCategories = Object.entries(expenseByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => `${cat}: ₱${amt}`)
                .join(', ');

            const expensesByDate = {};
            expenses.forEach(exp => {
                const dateStr = new Date(exp.date).toISOString().split('T')[0];
                expensesByDate[dateStr] = (expensesByDate[dateStr] || 0) + exp.amount;
            });

            const sortedDates = Object.keys(expensesByDate).sort();
            const last7Days = sortedDates.slice(-7).map(date => `${date}: ₱${expensesByDate[date]}`).join(' | ');

            const goalSummary = goals.length > 0
                ? goals.map(g => {
                    const percent = Math.round((g.saved / g.amount) * 100);
                    return `${g.name} (${percent}% complete, ₱${g.remainingToSave} left)`;
                }).join('; ')
                : "No active goals";

            const prompt = `
        You are a helpful and professional AI Financial Advisor. 
        A user has a budget of ₱${totalBudget} and has already spent ₱${totalExpenses}, leaving them with ₱${currentBalance}.
        Their spending burn rate is ${burnRate}%.
        Their spending breakdown by category is: ${sortedCategories || 'No expenses yet'}.
        
        Their financial goals status: ${goalSummary}.
        Their recent daily spending trend (last 7 active days): ${last7Days || 'No recent activity'}.
        Their active subscriptions total ₱${monthlySubTotal} per month.

        Based on this data, provide concise, encouraging, and actionable financial advice in 4-6 sentences. 
        Specific instructions:
        1. Analyze their spending vs. budget. If burn rate > 75%, be firm.
        2. Analyze their SPENDING TREND: Are they spending consistently or are there huge spikes? Mention this.
        3. Reference their specific goals.
        4. If they have NO goals, suggest essential ones.
        5. Be specific and personalized.
        
        Format the response in plain text.
      `;

            const modelsToTry = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-pro"];
            let advice = null;
            let lastError = null;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting to generate advice with model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    advice = result.response.text();
                    if (advice) break;
                } catch (e) {
                    console.warn(`Failed with model ${modelName}:`, e.message);
                    lastError = e;
                }
            }

            if (!advice) {
                throw lastError || new Error("Failed to generate advice with all available models.");
            }

            return successResponse({ advice });
        }

        // GET /forecast/:userId
        if (method === 'GET' && path.startsWith('/forecast/')) {
            const userId = path.replace('/forecast/', '');

            const expenses = await Expense.find({ user: userId }).sort({ date: 1 });
            const budget = await Budget.findOne({ user: userId });

            if (!expenses || expenses.length === 0) {
                return successResponse({ predictedAmount: 0, trend: 'neutral', message: 'Not enough data' });
            }

            const firstDate = new Date(expenses[0].date);
            const lastDate = new Date();
            const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));

            const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
            const avgDaily = totalSpent / daysDiff;

            const subscriptions = await Subscription.find({ user: userId });
            const monthlySubTotal = subscriptions.reduce((acc, sub) => {
                return acc + (sub.cycle === 'Monthly' ? sub.amount : sub.amount / 12);
            }, 0);

            const predictedAmount = (avgDaily * 30) + monthlySubTotal;

            let trend = 'neutral';
            if (budget) {
                if (predictedAmount > budget.totalAmount) trend = 'up';
                else if (predictedAmount < budget.totalAmount * 0.8) trend = 'down';
            }

            return successResponse({
                predictedAmount: Math.round(predictedAmount),
                avgDaily: Math.round(avgDaily),
                monthlySubTotal: Math.round(monthlySubTotal),
                trend
            });
        }

        // Route not found
        return errorResponse('Route not found', 404);

    } catch (error) {
        console.error('Advisor function error:', error);
        return errorResponse(error.message || 'Server error generating advice', 500);
    }
};
