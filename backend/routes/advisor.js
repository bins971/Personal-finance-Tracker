const express = require('express');
const router = express.Router();
const { getAdvice, getForecast } = require('../controllers/advisorController');

router.post('/advice', getAdvice);
router.get('/forecast/:userId', getForecast);

module.exports = router;
