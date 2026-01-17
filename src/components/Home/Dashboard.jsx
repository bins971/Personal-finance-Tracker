
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Card, Typography, Box, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Fab, LinearProgress, IconButton, Tooltip as MuiTooltip, CircularProgress
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import Subscriptions from './Subscriptions';
import ForecastWidget from './ForecastWidget';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler } from 'chart.js';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import styles from '../../styles/home.module.css';
import axios from 'axios';
import { API_URL } from "../../apiConfig";
import { AuthContext } from '../../context/AuthContext';
import AddGoalModal from './AddGoalModal';

ChartJS.register(ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler);

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalAmount, setTotalAmount] = useState(null);
  const [currentAmount, setCurrentAmount] = useState(null);
  const [startdate, setstartdate] = useState(null);
  const [enddate, setenddate] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [categoryPercentages, setCategoryPercentages] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [lineDataa, setLineData] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [smartProgress, setSmartProgress] = useState({ value: 0, color: 'primary', message: '' });

  // Goals State
  const [goals, setGoals] = useState([]);
  const [openGoalModal, setOpenGoalModal] = useState(false);

  const getDisplayName = () => {
    if (user?.username) return user.username;
    if (user?.email) {
      const name = user.email.split("@")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "Friend";
  };

  // const getGreeting = () => {
  //   const hour = new Date().getHours();
  //   if (hour < 12) return "Good Morning";
  //   if (hour < 18) return "Good Afternoon";
  //   return "Good Evening";
  // };

  // const quote = "Do not save what is left after spending, but spend what is left after saving.";

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || (!user.id && !user._id)) return;
        const userId = user.id || user._id;

        let bTotal = 0;
        let bCurrent = 0;
        let bStart = null;
        let bEnd = null;

        try {
          const response = await axios.get(`${API_URL}/budget/fetch/${userId}`);
          bTotal = response.data.totalAmount;
          bCurrent = response.data.currentAmount;
          bStart = response.data.startdate;
          bEnd = response.data.enddate;

          setTotalAmount(bTotal);
          setCurrentAmount(bCurrent);

          if (bStart) {
            setstartdate(new Date(bStart).toISOString().split('T')[0]);
          }
          if (bEnd) {
            setenddate(new Date(bEnd).toISOString().split('T')[0]);
          }
        } catch (e) {
          console.log("No budget found");
          setTotalAmount(0);
          setCurrentAmount(0);
        }

        const response1 = await axios.get(`${API_URL}/expense/category-percentage/${userId}`);
        setCategoryPercentages(response1.data?.categoryPercentages || []);

        const response2 = await axios.get(`${API_URL}/expense/daily-expenses/${userId}`)
        setDailyExpenses(response2.data?.dailyExpenses || []);

        const response3 = await axios.get(`${API_URL}/expense/all/${userId}`);
        const expenses = response3.data?.expenses || [];
        const sorted = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentTransactions(sorted);

        // Fetch Goals
        const userEmail = user?.email;
        if (userEmail) {
          try {
            const goalsRes = await axios.get(`${API_URL}/goal/email/${userEmail}`);
            setGoals(Array.isArray(goalsRes.data) ? goalsRes.data : []);
          } catch (e) {
            console.log("No goals found or error fetching goals");
            setGoals([]);
          }
        }

        // Smart Progress Logic
        if (bTotal > 0) {
          const spent = bTotal - bCurrent;
          const budgetPercent = (spent / bTotal) * 100;

          const start = new Date(bStart);
          const end = new Date(bEnd);
          const today = new Date();
          const totalDuration = end - start;
          const elapsed = today - start;
          const timePercent = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;

          let statusColor = 'success';
          let statusMsg = 'On Track';
          if (budgetPercent > timePercent + 10) {
            statusColor = 'error';
            statusMsg = 'Overspending Warning';
          } else if (budgetPercent > timePercent) {
            statusColor = 'warning';
            statusMsg = 'Slightly Ahead of Schedule';
          }
          setSmartProgress({ value: budgetPercent, color: statusColor, message: statusMsg, timeValue: timePercent });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const newLineData = {
      labels: dailyExpenses.map((item) => item._id),
      datasets: [
        {
          label: 'Daily Expenses',
          data: dailyExpenses.map((item) => item.totalAmount),
          borderColor: '#4F46E5', // Indigo
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
            gradient.addColorStop(1, 'rgba(79, 70, 229, 0.05)');
            return gradient;
          },
          borderWidth: 2,
          pointBackgroundColor: '#4F46E5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
      ],
    };
    setLineData(newLineData);
  }, [dailyExpenses]);

  // const data = {
  //   labels: categoryPercentages.map((item) => item.category),
  //   datasets: [
  //     {
  //       data: categoryPercentages.map((item) => item.percentage),
  //       backgroundColor: [
  //         'rgba(79, 70, 229, 0.8)',   // Indigo
  //         'rgba(16, 185, 129, 0.8)',  // Emerald
  //         'rgba(244, 63, 94, 0.8)',   // Rose
  //         'rgba(245, 158, 11, 0.8)',  // Amber
  //         'rgba(59, 130, 246, 0.8)',  // Blue
  //         'rgba(139, 92, 246, 0.8)'   // Violet
  //       ],
  //       borderColor: '#ffffff',
  //       borderWidth: 2,
  //       hoverOffset: 10
  //     },
  //   ],
  // };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6B7280', font: { family: 'Poppins' } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F3F4F6', borderDash: [5, 5] },
        ticks: { color: '#6B7280', font: { family: 'Poppins' } }
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const chartCardStyle = {
    padding: '24px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
    height: '100%',
    transition: 'transform 0.3s ease',
    '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.1)' }
  };

  return (
    <>
      <div className={styles.dbody}>
        <Container maxWidth="lg" sx={{ marginTop: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'Poppins', fontWeight: 500 }}>
              {startdate} — {enddate}
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Grid container spacing={4} justifyContent="center">
              {/* Dashboard Primary Actions & Greeting */}
              <Grid item xs={12} className={styles.greetingAnim}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={6} sx={{ borderBottom: '1px solid rgba(79, 70, 229, 0.1)', pb: 4 }}>
                  <Box>
                    <Typography variant="h3" fontWeight="900" sx={{
                      fontFamily: 'Poppins',
                      background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                      letterSpacing: '-0.02em'
                    }}>
                      Welcome back, {getDisplayName()}
                    </Typography>
                  </Box>

                  <Button
                    startIcon={<HistoryIcon />}
                    onClick={() => navigate('/budget-history')}
                    sx={{
                      bgcolor: 'rgba(79, 70, 229, 0.08)',
                      color: '#4F46E5',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontFamily: 'Poppins',
                      borderRadius: '12px',
                      px: 3,
                      py: 1,
                      '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.15)' }
                    }}
                  >
                    History
                  </Button>
                </Box>

                <Grid container spacing={4} mb={6}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      ...chartCardStyle,
                      p: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#ffffff',
                      borderRadius: '28px',
                      border: '1px solid rgba(79, 70, 229, 0.1)',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
                    }}>
                      <Box>
                        <Typography variant="h5" fontWeight="800" sx={{ color: '#1E1B4B', fontFamily: 'Poppins' }}>Set Financial Budget</Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/setBudget')}
                        sx={{
                          bgcolor: '#4338CA',
                          borderRadius: '14px',
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#3730A3', transform: 'translateY(-2px)' },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Plan Now
                      </Button>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      ...chartCardStyle,
                      p: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#ffffff',
                      borderRadius: '28px',
                      border: '1px solid rgba(244, 63, 94, 0.1)',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
                    }}>
                      <Box>
                        <Typography variant="h5" fontWeight="800" sx={{ color: '#1E1B4B', fontFamily: 'Poppins' }}>Analytic History</Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/budget-history')}
                        sx={{
                          bgcolor: '#F43F5E',
                          borderRadius: '14px',
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#E11D48', transform: 'translateY(-2px)' },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Explore
                      </Button>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={4} className={`${styles.fadeInUp} ${styles.delay1}`}>
                <Card sx={{
                  ...chartCardStyle,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                  color: 'white'
                }} className={styles.glassCard}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8, fontFamily: 'Poppins' }}>Total Budget</Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: 'Poppins', my: 1 }}>₱{totalAmount?.toLocaleString()}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{startdate} - {enddate}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4} className={`${styles.fadeInUp} ${styles.delay2}`}>
                <Card sx={chartCardStyle} className={styles.glassCard}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontFamily: 'Poppins' }}>Remaining</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" sx={{ fontFamily: 'Poppins', my: 1 }}>₱{currentAmount?.toLocaleString()}</Typography>
                    <LinearProgress variant="determinate" value={((currentAmount / totalAmount) * 100)} sx={{ height: 8, borderRadius: 4, bgcolor: '#EEF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#4F46E5' } }} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4} className={`${styles.fadeInUp} ${styles.delay3}`}>
                <Card sx={chartCardStyle} className={styles.glassCard}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontFamily: 'Poppins' }}>Smart Status</Typography>
                    <Box display="flex" alignItems="center" my={1}>
                      <Typography variant="h5" fontWeight="bold" color={smartProgress.color} sx={{ fontFamily: 'Poppins' }}>{smartProgress.message}</Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      Spent {Math.round(100 - (currentAmount / totalAmount * 100))}% in {Math.round(smartProgress.timeValue)}% of time
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Analytical Row: Forecast, Category Breakdown, Subscriptions */}
              <Grid item xs={12} md={4} className={`${styles.fadeInUp} ${styles.delay1}`}>
                <ForecastWidget />
              </Grid>

              <Grid item xs={12} md={4} className={`${styles.fadeInUp} ${styles.delay2}`}>
                <Card sx={chartCardStyle} className={styles.glassCard}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Poppins', mb: 3 }}>Category Breakdown</Typography>
                  <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {categoryPercentages.length > 0 ? (
                      categoryPercentages.map((item, index) => (
                        <Box key={index} mb={2}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" fontWeight="600" sx={{ fontFamily: 'Poppins' }}>{item.category}</Typography>
                            <Typography variant="caption" fontWeight="600" color="textSecondary">{Number(item.percentage).toFixed(1)}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Number(item.percentage)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#F3F4F6',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: [
                                  '#4F46E5', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6'
                                ][index % 6],
                                borderRadius: 4
                              }
                            }}
                          />
                        </Box>
                      ))
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body2" color="textSecondary">No data available</Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={4} className={`${styles.fadeInUp} ${styles.delay3}`}>
                <Subscriptions />
              </Grid>


              <Grid item xs={12} md={7} className={`${styles.fadeInUp} ${styles.delay5}`}>
                <Card sx={chartCardStyle} className={styles.glassCard}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Poppins', mb: 3 }}>Spending Trend</Typography>
                  <Box height="250px">
                    <Line data={lineDataa} options={{ ...lineOptions, maintainAspectRatio: false }} />
                  </Box>
                </Card>
              </Grid>

              {/* Transactions Table - Moved beside Spending Trend */}
              <Grid item xs={12} md={5} className={`${styles.fadeInUp} ${styles.delay4}`} id="recent-transactions">
                <Card sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)', height: '100%' }} className={styles.glassCard}>
                  <Box p={3} display="flex" justifyContent="space-between" alignItems="center" bgcolor="rgba(255,255,255,0.9)">
                    <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Poppins' }}>Recent Transactions</Typography>
                  </Box>

                  {/* Search Bar */}
                  <Box px={3} pb={2}>
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        sx: { borderRadius: '12px', bgcolor: '#F9FAFB' }
                      }}
                    />
                  </Box>

                  <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 220 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                          <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.75rem' }}>Amount</TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.75rem' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentTransactions
                          .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .slice(0, 5)
                          .map((row) => (
                            <TableRow key={row._id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                              <TableCell sx={{ fontFamily: 'Poppins', fontSize: '0.8rem' }}>{row.name}</TableCell>
                              <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem' }}>₱{row.amount.toLocaleString()}</TableCell>
                              <TableCell align="right">
                                <IconButton size="small" sx={{ color: '#EF4444' }} onClick={async () => {
                                  if (window.confirm('Delete?')) {
                                    await axios.delete(`${API_URL}/expense/delete/${row._id}`);
                                    window.location.reload();
                                  }
                                }}>
                                  <DeleteIcon fontSize="inherit" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box p={2} textAlign="center">
                    <Button size="small" onClick={() => navigate('/api/expense/all/' + (user.id || user._id))} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>View All</Button>
                  </Box>
                </Card>
              </Grid>


              {/* Goals Widget - Moved to Bottom for visibility */}
              <Grid item xs={12} className={styles.fadeInUp}>
                <Card sx={{ ...chartCardStyle, p: 4, bgcolor: '#ffffff' }} className={styles.glassCard}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="h5" fontWeight="900" sx={{
                        fontFamily: 'Poppins',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mr: 2
                      }}>
                        Current Goals
                      </Typography>
                      <Box sx={{ px: 2, py: 0.5, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50px' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>
                          {goals.length} Active
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => setOpenGoalModal(true)}
                      startIcon={<AddIcon />}
                      sx={{
                        bgcolor: '#10B981',
                        borderRadius: '12px',
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#059669', transform: 'translateY(-2px)' },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      New Goal
                    </Button>
                  </Box>

                  <Grid container spacing={3}>
                    {goals.length === 0 ? (
                      <Grid item xs={12}>
                        <Box display="flex" flexDirection="column" alignItems="center" py={6} sx={{ bgcolor: '#F9FAFB', borderRadius: '20px', border: '2px dashed #E5E7EB' }}>
                          <Typography variant="body1" color="textSecondary" sx={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            No active goals found. Start saving for your dreams today! 🚀
                          </Typography>
                        </Box>
                      </Grid>
                    ) : (
                      goals.map(goal => (
                        <Grid item xs={12} md={6} lg={4} key={goal._id}>
                          <Box sx={{
                            p: 3,
                            borderRadius: '20px',
                            bgcolor: '#F9FAFB',
                            border: '1px solid #EEF2FF',
                            transition: 'all 0.3s ease',
                            '&:hover': { bgcolor: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', transform: 'scale(1.02)' }
                          }}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                              <Typography variant="h6" fontWeight="800" sx={{ fontFamily: 'Poppins', color: '#1E1B4B' }}>{goal.name}</Typography>
                              <Typography variant="subtitle2" fontWeight="800" color="primary">
                                {Math.round((goal.saved / goal.amount) * 100)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (goal.saved / goal.amount) * 100)}
                              sx={{
                                height: 10,
                                borderRadius: 5,
                                bgcolor: '#EEF2FF',
                                mb: 2,
                                '& .MuiLinearProgress-bar': {
                                  background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                                  borderRadius: 5
                                }
                              }}
                            />
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="caption" color="textSecondary" fontWeight="600">
                                ₱{goal.saved.toLocaleString()} Saved
                              </Typography>
                              <Typography variant="caption" color="textSecondary" fontWeight="600">
                                Target: ₱{goal.amount.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))
                    )}
                  </Grid>
                </Card>
              </Grid>

              {/* Add Expense Footer - As requested by user */}
              <Grid item xs={12} sx={{ mt: 6, mb: 8 }}>
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={() => setOpenAddModal(true)}
                    startIcon={<AddIcon sx={{ fontSize: '2rem !important' }} />}
                    sx={{
                      bgcolor: '#4F46E5',
                      color: 'white',
                      borderRadius: '100px',
                      px: 8,
                      py: 2.5,
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      fontFamily: 'Poppins',
                      boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)',
                      '&:hover': {
                        bgcolor: '#4338CA',
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 30px 60px -12px rgba(79, 70, 229, 0.5)'
                      },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    Add an Expense
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Container>
      </div>

      {/* Quick Add FAB */}
      <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 2000 }}>
        <MuiTooltip title="Quick Add Expense" placement="left">
          <Fab
            color="primary"
            aria-label="add"
            onClick={() => setOpenAddModal(true)}
            sx={{
              bgcolor: '#4F46E5',
              '&:hover': { bgcolor: '#4338CA' },
              boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)',
              width: 64, height: 64
            }}
          >
            <AddIcon sx={{ fontSize: 30 }} />
          </Fab>
        </MuiTooltip>
      </Box >

      {/* Add Expense Dialog */}
      <Dialog
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        PaperProps={{
          style: { borderRadius: 24, padding: '10px' }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: 'Poppins', fontWeight: 700, textAlign: 'center', pb: 0 }}>Add New Expense</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              autoFocus margin="dense" label="Expense Name" fullWidth variant="outlined"
              value={newExpense.name} onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <TextField
              margin="dense" label="Amount" type="number" fullWidth variant="outlined"
              value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <TextField
              margin="dense" fullWidth variant="outlined" select
              SelectProps={{ native: true }}
              value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              <option value="" disabled>Select Category</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Utilities">Utilities</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Health">Health</option>
              <option value="Others">Others</option>
            </TextField>
            <TextField
              margin="dense" label="Date" type="date" fullWidth variant="outlined" InputLabelProps={{ shrink: true }}
              value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setOpenAddModal(false)}
            sx={{ borderRadius: '50px', px: 4, textTransform: 'none', color: '#6B7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await axios.post(`${API_URL}/expense/add`, {
                  user: (user.id || user._id),
                  ...newExpense,
                  amount: Number(newExpense.amount)
                });
                setOpenAddModal(false);
                window.location.reload();
              } catch (err) {
                alert('Error adding expense');
              }
            }}
            variant="contained"
            sx={{ borderRadius: '50px', px: 6, py: 1, textTransform: 'none', bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <AddGoalModal
        open={openGoalModal}
        onClose={() => setOpenGoalModal(false)}
        onGoalAdded={() => window.location.reload()}
      />
    </>
  );
};

export default Dashboard;
