const Goal = require('../models/Goal');
const User = require('../models/User');

exports.createGoal = async (req, res) => {
  try {
    const user = await User.findById(req.body.user);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const goal = new Goal(req.body);
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createUserGoal = async (req, res) => {
  try {
    const { email, name, amount, saved, description, startDate, endDate } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const goal = new Goal({
      user: user._id,
      name,
      amount,
      saved,
      description,
      startDate,
      endDate,
    });

    await goal.save();
    res.status(201).json({ message: 'Goal created successfully!', goal });
  } catch (error) {
    console.error('Error creating goal:', error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.getGoalsByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const goals = await Goal.find({ user: req.user._id });
    res.status(200).json(goals);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getGoalsByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    // console.log(`Fetching goals for email: ${email}`);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const goals = await Goal.find({ user: user._id });
    // Return empty array instead of 404 if no goals found, to be safer for frontend
    res.status(200).json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.updateGoalSaved = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const { saved } = req.body;
    if (saved !== undefined) {
      goal.saved += saved;
    }

    await goal.save();
    res.status(200).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndDelete(req.params.id);

    if (!goal) {
      return res.status(404).json({ error: "Goal not found." });
    }

    res.status(200).json({ message: "Goal deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete the goal." });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { saved, amount } = req.body;
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    goal.saved = saved !== undefined ? saved : goal.saved;
    goal.amount = amount !== undefined ? amount : goal.amount;
    await goal.save();

    res.status(200).json({ message: 'Goal updated successfully!', goal });
  } catch (error) {
    console.error('Error updating goal:', error.message);
    res.status(400).json({ error: error.message });
  }
};
