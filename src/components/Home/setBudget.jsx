import React, { useState, useEffect, useContext } from 'react';
import styles from '../../styles/addform.module.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext.js";
import axios from 'axios';
import { API_URL } from "../../apiConfig";
import { Box, Typography } from '@mui/material';

const BudgetForm = () => {
  const { user } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [totalAmount, setTotalAmount] = useState(null);
  const [startdate, setstartdate] = useState(null);
  const [enddate, setenddate] = useState(null);
  const [budgetData, setBudgetData] = useState(null);  // Store budget data in state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!user || !user.id) return;
      try {
        const response1 = await axios.get(`${API_URL}/budget/fetch/${user.id}`);

        // Setting totalAmount
        setTotalAmount(response1.data.totalAmount);

        // Formatting start date
        if (response1.data.startdate) {
          const startdate = new Date(response1.data.startdate);
          if (!isNaN(startdate.getTime())) {
            setstartdate(startdate.toISOString().split('T')[0]);
          }
        }

        // Formatting end date
        if (response1.data.enddate) {
          const enddate = new Date(response1.data.enddate);
          if (!isNaN(enddate.getTime())) {
            setenddate(enddate.toISOString().split('T')[0]);
          }
        }

        // Store the fetched data in state
        setBudgetData(response1.data);  // Store response in state

      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    // Fetching the data when the component mounts or user.id changes
    fetchBudgetData();
  }, [user]);


  const handleBack = () => {
    navigate("/home");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        setError('User not found');
        return;
      }
      // Check if the budget data is already fetched
      const url = budgetData ? `${API_URL}/budget/update/${userId}` : `${API_URL}/budget/create`;
      console.log("id")

      const method = budgetData ? 'PUT' : 'POST';

      const body = {
        user: user.id,
        totalAmount,
        currentAmount: totalAmount,
        startDate: startdate,
        endDate: enddate,
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert('Budget ' + (method === 'POST' ? 'created' : 'updated') + ' successfully!');
        navigate('/home'); // Navigate to the home page after successful submit
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to set budget');
      }
    } catch (err) {
      setError('Error setting budget');
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formLeft}>
        <div className={styles.welcomeIcon}></div>
        <h2 className={styles.welcomeTitle}>Budget</h2>
        <p className={styles.welcomeText}>Fill in your Budget details!</p>

        <Box sx={{ mt: 4, mb: 4, textAlign: 'left', px: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#EEF2FF', mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🏆 How to earn medals
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.2rem' }}>🥇</span> Save 30% or more to get Gold
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.2rem' }}>🥈</span> Save 15% - 29% to get Silver
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.2rem' }}>🥉</span> Save 5% - 14% to get Bronze
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
            * Achievement is awarded when you set a NEW budget period.
          </Typography>
        </Box>

        <button className={styles.backButton} onClick={handleBack}>GO BACK</button>
      </div>
      <div className={styles.formRight}>
        <h3 className={styles.formTitle}>Details</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label>Amount</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Start Date</label>
            <input
              type="date"
              value={startdate}
              onChange={(e) => setstartdate(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>End Date</label>
            <input
              type="date"
              value={enddate}
              onChange={(e) => setenddate(e.target.value)}
              className={styles.input}
              required
            />
          </div>



          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button type="submit" className={styles.submitButton}>
            SET
          </button>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
