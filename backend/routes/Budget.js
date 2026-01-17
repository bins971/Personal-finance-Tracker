const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const User = require('../models/User');
const Expense = require('../models/Expense');
const BudgetHistory = require('../models/BudgetHistory');
router.post('/create', async (req, res) => {
  const { user: userId, totalAmount, currentAmount, startDate, endDate } = req.body;
  console.log("&&&&&&&&&&")
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ARCHIVAL LOGIC
    const existingBudget = await Budget.findOne({ user: userId });
    if (existingBudget) {
      const expenses = await Expense.find({ user: userId });
      const Subscription = require('../models/Subscription');
      const subscriptions = await Subscription.find({ user: userId });

      let archivedExpenses = expenses.map(e => ({
        category: e.category,
        name: e.name,
        amount: e.amount,
        date: e.date,
        description: e.description
      }));

      // Add subscription virutal transactions to history
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
    res.status(201).json({ message: 'Budget set and data reset successfully!', budget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const { totalAmount, startDate, endDate } = req.body;
    const userId = req.params.id;
    const existingBudget = await Budget.findOne({ user: userId });

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    // ARCHIVAL LOGIC: If a user "updates" their budget, we archive the old period.
    const expenses = await Expense.find({ user: userId });
    const Subscription = require('../models/Subscription');
    const subscriptions = await Subscription.find({ user: userId });

    let archivedExpenses = expenses.map(e => ({
      category: e.category,
      name: e.name,
      amount: e.amount,
      date: e.date,
      description: e.description
    }));

    // Add subscription virutal transactions to history
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
    res.status(200).json({ message: 'Budget reset and history saved!', budget: existingBudget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/fetch/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const budget = await Budget.findOne({ user: userId });
    if (budget) {
      const Subscription = require('../models/Subscription');
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

      return res.json({
        totalAmount: budget.totalAmount,
        currentAmount: Math.max(0, budget.currentAmount - subscriptionTotal),
        startdate: budget.startDate,
        enddate: budget.endDate
      });
    } else {
      return res.status(404).json({ message: 'User budget not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await BudgetHistory.find({ user: userId }).sort({ archivedDate: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});



module.exports = router;