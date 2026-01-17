const express = require('express');
const router = express.Router();
const { addSubscription, getSubscriptions, deleteSubscription } = require('../controllers/subscriptionController');

router.post('/add', addSubscription);
router.get('/get/:userId', getSubscriptions);
router.delete('/delete/:id', deleteSubscription);

module.exports = router;
