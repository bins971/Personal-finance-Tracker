const Subscription = require('../models/Subscription');

// Add a new subscription
exports.addSubscription = async (req, res) => {
    const { user, name, amount, cycle, startDate } = req.body;

    try {
        const newSubscription = new Subscription({
            user,
            name,
            amount,
            cycle,
            category: req.body.category || 'Subscription',
            startDate
        });

        const savedSubscription = await newSubscription.save();
        res.status(201).json(savedSubscription);
    } catch (error) {
        console.error("Error adding subscription:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all subscriptions for a user
exports.getSubscriptions = async (req, res) => {
    const { userId } = req.params;

    try {
        const subscriptions = await Subscription.find({ user: userId }).sort({ nextPaymentDate: 1 });
        res.status(200).json(subscriptions);
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete a subscription
exports.deleteSubscription = async (req, res) => {
    const { id } = req.params;

    try {
        await Subscription.findByIdAndDelete(id);
        res.status(200).json({ message: "Subscription Deleted" });
    } catch (error) {
        console.error("Error deleting subscription:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
