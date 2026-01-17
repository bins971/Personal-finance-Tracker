const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require('mongoose');
const userRoutes = require("./routes/Auth");
const budgetRoutes = require("./routes/Budget");
const goalRoutes = require("./routes/Goal");
const connectDB = require("./config/db");
const ExpenseRoutes = require("./routes/Expense");
const advisorRoutes = require("./routes/advisor");
const subscriptionRoutes = require("./routes/Subscription");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Health Check
app.get("/health", (req, res) => res.status(200).json({ status: "UP", timestamp: new Date() }));

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/expense", ExpenseRoutes);
app.use("/api/goal", goalRoutes);
app.use("/api/advisor", advisorRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  app.use(express.static(path.join(__dirname, "../build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../build", "index.html"));
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
