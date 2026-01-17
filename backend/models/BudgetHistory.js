const mongoose = require('mongoose');
const { Schema } = mongoose;

const BudgetHistorySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    remainingAmount: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    archivedDate: {
        type: Date,
        default: Date.now
    },
    expenses: [{
        category: String,
        name: String,
        amount: Number,
        date: Date,
        description: String
    }],
    achievement: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('BudgetHistory', BudgetHistorySchema);
