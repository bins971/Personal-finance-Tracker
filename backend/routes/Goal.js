const express = require('express');
const router = express.Router();
const {
  createGoal,
  createUserGoal,
  getGoalsByUser,
  getGoalsByEmail,
  updateGoalSaved,
  deleteGoal,
  updateGoal
} = require('../controllers/goalController');

router.post('/create', createGoal);
router.post('/usercreate', createUserGoal);
router.get('/goals', getGoalsByUser);
router.get('/email/:email', getGoalsByEmail);
router.patch('/goals/:id', updateGoalSaved);
router.delete('/:id', deleteGoal);
router.put('/:id', updateGoal);

module.exports = router;
