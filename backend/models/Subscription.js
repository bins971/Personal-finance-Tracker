const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    cycle: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        default: 'Monthly'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        default: 'Subscription'
    },
    nextPaymentDate: {
        type: Date
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Middleware to calculate next payment date before saving
SubscriptionSchema.pre('save', function (next) {
    if (!this.nextPaymentDate && this.startDate) {
        const start = new Date(this.startDate);
        const nextDate = new Date(start);
        if (this.cycle === 'Monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (this.cycle === 'Yearly') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        this.nextPaymentDate = nextDate;
    }
    next();
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
