import React, { useState, useEffect } from "react";
import { API_URL } from "../../apiConfig";
import NoData from "../../images/NoData.png";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../../styles/home.module.css";
import { useAuth } from "../../context/AuthContext";

const Achievement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [historyAchievements, setHistoryAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userId = user?.id || user?._id;
      if (userId) {
        setLoading(true);
        try {
          const [goalsRes, historyRes] = await Promise.all([
            axios.get(`${API_URL}/goal/email/${user.email}`),
            axios.get(`${API_URL}/budget/history/${userId}`)
          ]);
          const completedGoals = Array.isArray(goalsRes.data)
            ? goalsRes.data.filter(g => g.saved >= g.amount)
            : [];
          setGoals(completedGoals);
          const achievements = Array.isArray(historyRes.data) ? historyRes.data.filter(h => h.achievement) : [];
          setHistoryAchievements(achievements);
        } catch (error) {
          console.error("Error fetching achievement data:", error);
          setError(true);
        } finally {
          setLoading(false);
        }
      } else if (user === null) {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);


  return (
    <div className={styles.dbody}>
      <Container>
        {loading ? (
          <Typography variant="h6">Loading...</Typography>
        ) : error ? (
          <img src={NoData} alt="Error" style={{ maxWidth: "200px", marginBottom: "20px" }} />
        ) : (
          <>
            {(historyAchievements.length > 0 || goals.length > 0) ? (
              <Box sx={{ marginBottom: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <IconButton onClick={() => navigate('/home')} sx={{ mr: 2, color: '#4F46E5' }}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Poppins', color: '#1E1B4B' }}>
                    Your Achievement
                  </Typography>
                </Box>

                <Grid container spacing={4}>
                  {/* Priority: History Achievements (Budget Medals) */}
                  {historyAchievements.map((ach, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`hist-${index}`}>
                      <Paper
                        sx={{
                          padding: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                          borderRadius: 4,
                          position: "relative",
                          border: '1px solid rgba(79, 70, 229, 0.1)',
                          background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)'
                        }}
                      >
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                          <Typography variant="h2" sx={{ mb: 1 }}>
                            {ach.achievement ? ach.achievement.split(' ')[0] : '🏆'}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4338CA', fontFamily: 'Poppins' }}>
                            {ach.achievement ? ach.achievement.split(' ').slice(1).join(' ') : 'Achievement'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280', fontFamily: 'Poppins', mb: 1 }}>
                            Budget Period Achievement
                          </Typography>
                          <Box sx={{ mt: 1, px: 2, py: 0.5, bgcolor: 'white', borderRadius: '50px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                              Saved {Math.round((ach.remainingAmount / ach.totalAmount) * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}

                  {/* Secondary: Accomplished Goals (at the bottom) */}
                  {goals.map((goal) => (
                    <Grid item xs={12} sm={6} md={4} key={goal._id}>
                      <Paper
                        sx={{
                          padding: 4,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                          borderRadius: 4,
                          border: '1px solid rgba(16, 185, 129, 0.1)',
                          background: 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)'
                        }}
                      >
                        <Typography variant="h2" sx={{ mb: 1 }}>�</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#059669', fontFamily: 'Poppins' }}>
                          Goal Mastered!
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6B7280', fontFamily: 'Poppins' }}>
                          {goal.name} Target Reached
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", marginTop: 8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <IconButton onClick={() => navigate('/home')} sx={{ mr: 2, color: '#9CA3AF' }}>
                    <ArrowBackIcon />
                  </IconButton>
                </Box>
                <Typography variant="h6" color="textSecondary" sx={{ fontFamily: 'Poppins' }}>No Achievements Yet</Typography>
                <Typography variant="body2" color="textSecondary">Keep hitting your goals and saving budget to earn medals!</Typography>
              </Box>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Achievement;
