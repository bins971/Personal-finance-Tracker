const db = require('../config/db'); 

const getBudgetByEmail = async (email) => {
  try {

    const result = await db.query('SELECT amount FROM budgets WHERE email = ?', [email]);
    return result[0]; 
  } catch (error) {
    throw new Error('Error fetching budget from database');
  }
};

module.exports = { getBudgetByEmail };
