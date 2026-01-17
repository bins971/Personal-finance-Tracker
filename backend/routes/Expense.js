const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

router.post("/add", async (req, res) => {
  try {
    const { user, category, name, amount, date, description } = req.body;

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
      return res.status(404).json({ error: "No budget found for this user." });
    }

    if (budget.currentAmount < amount) {
      return res.status(400).json({ error: "Insufficient budget for this expense." });
    }
    console.log("no")
    await newExpense.save();
    budget.currentAmount -= amount;
    await budget.save();

    res.status(201).json({
      message: "Expense added and budget updated!",
      expense: newExpense,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/daily-expenses/:userId', async (req, res) => {
  console.log("working")
  try {
    const { userId } = req.params;


    const budget = await Budget.findOne({ user: userId });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found for the user.' });
    }

    const { startDate, endDate } = budget;
    const Subscription = require('../models/Subscription');
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

    // Convert to a map for easy merging
    const dailyMap = dailyExpensesQuery.reduce((acc, curr) => {
      acc[curr._id] = curr.totalAmount;
      return acc;
    }, {});

    // Add subscription costs
    const start = new Date(startDate);
    const end = new Date(endDate);

    subscriptions.forEach(sub => {
      let current = new Date(sub.startDate);
      // Ensure we start checking from a reasonable point relative to the budget start
      // But subscriptions are recurring, so we check every cycle that falls within [start, end]

      if (sub.cycle === 'Monthly') {
        // Check each month in the budget range
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

    res.json({
      user: userId,
      budgetPeriod: { startDate, endDate },
      dailyExpenses,
    });
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/all/:user', async (req, res) => {
  try {
    const { user: userId } = req.params;
    const budget = await Budget.findOne({ user: userId });

    let query = { user: userId };
    if (budget) {
      query.date = { $gte: new Date(budget.startDate), $lte: new Date(budget.endDate) };
    }

    let expenses = await Expense.find(query).sort({ date: -1 }).lean();

    // Add subscription costs as virtual transactions
    const Subscription = require('../models/Subscription');
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

    // Sort again since we added virtual transactions
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      message: "Expenses fetched successfully!",
      expenses,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get('/category-percentage/:user', async (req, res) => {
  try {
    const { user: userId } = req.params;
    const budget = await Budget.findOne({ user: userId });

    let query = { user: userId };
    if (budget) {
      query.date = { $gte: new Date(budget.startDate), $lte: new Date(budget.endDate) };
    }

    const expenses = await Expense.find(query).lean();
    const Subscription = require('../models/Subscription');
    const subscriptions = await Subscription.find({ user: userId });

    const categorySums = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) acc[expense.category] = 0;
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    // Add subscription costs if a budget exists
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

    res.status(200).json({
      message: "Category percentages calculated successfully!",
      categoryPercentages,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/duration/:user', async (req, res) => {
  try {
    const { user } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Please provide both startDate and endDate in query parameters." });
    }

    const expenses = await Expense.find({
      user: user,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    if (!expenses.length) {
      return res.status(404).json({ error: "No expenses found for the specified duration." });
    }

    res.status(200).json({
      message: "Expenses for the specified duration fetched successfully!",
      expenses,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedExpense) {
      return res.status(404).json({ error: "Expense not found." });
    }

    res.status(200).json({
      message: "Expense updated successfully!",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found." });
    }

    // Add amount back to budget
    const budget = await Budget.findOne({ user: expense.user });
    if (budget) {
      budget.currentAmount += expense.amount;
      await budget.save();
    }

    await Expense.findByIdAndDelete(id);

    res.status(200).json({ message: "Expense deleted successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
