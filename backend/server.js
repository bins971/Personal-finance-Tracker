const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoutes = require("./routes/Auth");
const budgetRoutes = require("./routes/Budget");
const goalRoutes = require("./routes/Goal");
const connectDB = require("./config/db");
const ExpenseRoutes = require("./routes/Expense");
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(cors());

connectDB();
app.use("/api/auth", userRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/expense", ExpenseRoutes)
app.use("/api/goal", goalRoutes);
app.use('/api', expenseRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to the User API");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));
