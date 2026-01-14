const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const fetchUser = require('../middleware/fetchUser');

router.post('/advice', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Fetch User's Budget
        const budget = await Budget.findOne({ user: userId });

        // Fetch User's Expenses
        const expenses = await Expense.find({ user: userId });

        if (!budget) {
            return res.status(200).json({
                advice: "It looks like you haven't set a budget yet. Setting a budget is the first step to financial freedom! Go to the Budget section to get started."
            });
        }

        const totalBudget = budget.totalAmount;
        const currentBalance = budget.currentAmount;
        const totalExpenses = totalBudget - currentBalance;
        const burnRate = (totalExpenses / totalBudget) * 100;

        let advice = "";

        // Rule-based "AI" Logic
        if (burnRate > 90) {
            advice += "Warning: You have used over 90% of your budget! It's time to cut back on discretionary spending immediately. ";
        } else if (burnRate > 75) {
            advice += "Caution: You've used over 75% of your budget. Keep an eye on your expenses for the rest of the period. ";
        } else if (burnRate < 50 && new Date() > new Date(budget.endDate).setDate(new Date(budget.endDate).getDate() - 5)) {
            advice += "Great job! You are well under budget and the period is almost over. Consider allocating the surplus to your savings goals. ";
        } else {
            advice += "You are on track with your budget. Keep it up! ";
        }

        // Category Analysis
        const expenseByCategory = {};
        expenses.forEach(exp => {
            if (expenseByCategory[exp.category]) {
                expenseByCategory[exp.category] += exp.amount;
            } else {
                expenseByCategory[exp.category] = exp.amount;
            }
        });

        const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

        if (sortedCategories.length > 0) {
            const topCategory = sortedCategories[0];
            advice += `\n\nYour highest spending category is ${topCategory[0]} with ₱${topCategory[1]}. See if there are any subscriptions or recurring costs here you can reduce.`;
        }

        res.json({ advice });

    } catch (error) {
        console.error('Error generating advice:', error);
        res.status(500).json({ message: 'Server error generating advice' });
    }
});

module.exports = router;
