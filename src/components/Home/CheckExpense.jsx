import React, { useState, useEffect } from "react";
import { API_URL } from "../../apiConfig";
import styles from "../../styles/checkexpense.module.css";
import axios from "axios";

import { useParams } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import NoData from "../../images/NoData.png";
export default function CheckExpense() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [error] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("daily");
  const { id } = useParams();


  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await axios.get(`${API_URL}/expense/all/${id}`);

        if (response.data.message === "Expenses fetched successfully!") {
          setExpenses(response.data.expenses);
          setFilteredExpenses(response.data.expenses);
        }
      } catch (err) {
        console.error("Error fetching expenses:", err);

      }
    };

    fetchExpenses();
  }, [id]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      if (viewMode === "daily") {

        const formattedDate = date.toLocaleDateString();
        const filtered = expenses.filter(expense =>
          new Date(expense.date).toLocaleDateString() === formattedDate
        );
        setFilteredExpenses(filtered);
      } else if (viewMode === "monthly") {

        const selectedMonthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const filtered = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          const expenseMonthYear = `${expenseDate.getFullYear()}-${expenseDate.getMonth() + 1}`;
          return expenseMonthYear === selectedMonthYear;
        });
        setFilteredExpenses(filtered);
      }
    } else {
      setFilteredExpenses(expenses);
    }
  };

  const calculateTotalAmount = () => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    setSelectedDate(null);
    setFilteredExpenses(expenses);
  };

  return (
    <div>
      <div className={styles.dailyexpense}>
        <h1>Expenses</h1>

        {/* Toggle Buttons for View Mode */}
        <div className={styles.togbtn}>
          <div>
            <button
              className={viewMode === "daily" ? styles.activeButton : ""}
              onClick={() => toggleViewMode("daily")}>Daily</button></div>
          <div>
            <button
              className={viewMode === "monthly" ? styles.activeButton : ""}
              onClick={() => toggleViewMode("monthly")}>Monthly</button></div>
        </div>

        {/* Date Picker */}
        <div>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat={viewMode === "daily" ? "MM/dd/yyyy" : "MM/yyyy"}
            showMonthYearPicker={viewMode === "monthly"}
            placeholderText={viewMode === "daily" ? "Select a date" : "Select a month"}
          />
        </div>

        {/* Display Total Amount */}
        <div>
          <h3>Total Amount: ₱{calculateTotalAmount().toFixed(2)}</h3>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {filteredExpenses.length > 0 ? (
        <div className={styles.cardContainer}>
          {filteredExpenses.map((expense) => (
            <div key={expense._id} className={styles.card}>
              <h3>{expense.name}</h3>
              <p><strong>Category:</strong> {expense.category}</p>
              <p><strong>Amount:</strong> ₱{expense.amount}</p>
              <p><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</p>
              <p><strong>Description:</strong> {expense.description || "N/A"}</p>

            </div>
          ))}
        </div>
      ) : (

        <div className={styles.nodata}>
          <img src={NoData} alt="Error" style={{ maxWidth: "200px", marginBottom: "20px" }} />
        </div>
      )}
    </div>
  );
}
