const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.getAdvice = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing in .env');
            return res.status(500).json({ message: 'AI configuration error: Missing API Key' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Switching to gemini-pro as 1.5-flash was returning 404s
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Fetch User's Budget
        const budget = await Budget.findOne({ user: userId });

        // Fetch User's Expenses
        const expenses = await Expense.find({ user: userId });

        // Fetch User's Goals
        const goals = await Goal.find({ user: userId });

        if (!budget) {
            return res.status(200).json({
                advice: "It looks like you haven't set a budget yet. Setting a budget is the first step to financial freedom! Go to the Budget section to get started."
            });
        }

        const totalBudget = budget.totalAmount;
        const currentBalance = budget.currentAmount;
        const totalExpenses = totalBudget - currentBalance;
        const burnRate = ((totalExpenses / totalBudget) * 100).toFixed(2);

        // Fetch Subscriptions
        const Subscription = require('../models/Subscription');
        const subscriptions = await Subscription.find({ user: userId });
        const monthlySubTotal = subscriptions.reduce((acc, sub) => {
            return acc + (sub.cycle === 'Monthly' ? sub.amount : sub.amount / 12);
        }, 0);

        // Category Analysis
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

        // Daily Trend Analysis (Simulates Line Chart Data)
        const expensesByDate = {};
        expenses.forEach(exp => {
            const dateStr = new Date(exp.date).toISOString().split('T')[0];
            expensesByDate[dateStr] = (expensesByDate[dateStr] || 0) + exp.amount;
        });

        // Get last 7 active days
        const sortedDates = Object.keys(expensesByDate).sort();
        const last7Days = sortedDates.slice(-7).map(date => `${date}: ₱${expensesByDate[date]}`).join(' | ');

        // Goal Analysis
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

        // List of models to try in order of preference (Updated for 2026 availability)
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-pro"];
        let advice = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting to generate advice with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                advice = result.response.text();
                if (advice) break; // Success
            } catch (e) {
                console.warn(`Failed with model ${modelName}:`, e.message);
                lastError = e;
            }
        }

        if (!advice) {
            throw lastError || new Error("Failed to generate advice with all available models.");
        }

        res.json({ advice });

    } catch (error) {
        console.error('Error generating advice:', error);
        // Provide more context if it's a Gemini error
        const errorMessage = error.message || 'Server error generating advice';
        res.status(500).json({ message: errorMessage });
    }
};

exports.getForecast = async (req, res) => {
    try {
        const { userId } = req.params;

        const expenses = await Expense.find({ user: userId }).sort({ date: 1 });
        const budget = await Budget.findOne({ user: userId });

        if (!expenses || expenses.length === 0) {
            return res.status(200).json({ predictedAmount: 0, trend: 'neutral', message: 'Not enough data' });
        }

        // Calculate Average Daily Spend
        const firstDate = new Date(expenses[0].date);
        const lastDate = new Date(); // Today
        const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));

        const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const avgDaily = totalSpent / daysDiff;

        // Fetch Subscriptions for the user
        const Subscription = require('../models/Subscription');
        const subscriptions = await Subscription.find({ user: userId });
        const monthlySubTotal = subscriptions.reduce((acc, sub) => {
            return acc + (sub.cycle === 'Monthly' ? sub.amount : sub.amount / 12);
        }, 0);

        // Predict next 30 days: (Average daily spending * 30) + Monthly subscription costs
        const predictedAmount = (avgDaily * 30) + monthlySubTotal;

        let trend = 'neutral';
        if (budget) {
            if (predictedAmount > budget.totalAmount) trend = 'up'; // Danger
            else if (predictedAmount < budget.totalAmount * 0.8) trend = 'down'; // Saving
        }

        res.status(200).json({
            predictedAmount: Math.round(predictedAmount),
            avgDaily: Math.round(avgDaily),
            monthlySubTotal: Math.round(monthlySubTotal),
            trend
        });

    } catch (error) {
        console.error("Error generating forecast:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
