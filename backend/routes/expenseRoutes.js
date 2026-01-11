const express = require('express');
const router = express.Router();
const { getBudgetByEmail } = require('../controllers/expenseController');

router.get('/api/budget/:email', async (req, res) => {
  const { email } = req.params; 

  try {
    const budget = await getBudgetByEmail(email); 
    if (budget) {
      res.json({ amount: budget.amount }); 
    } else {
      res.status(404).json({ message: 'Budget not found' });
    }
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
