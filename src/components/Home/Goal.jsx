
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  Typography,
  Button,
  Box,
  TextField,
  Modal,
  IconButton,
  LinearProgress
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../apiConfig";
import NoData from "../../images/NoData.png";
import { useAuth } from "../../context/AuthContext";

const MyGoal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      if (user && user.email) {
        try {
          const response = await axios.get(`${API_URL}/goal/email/${user.email}`);
          setGoals(response.data);
        } catch (error) {
          console.error("Error fetching goals:", error.response?.data || error.message);
          setError("Could not fetch goals");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGoals();
  }, [user]);

  const handleEditGoal = (goal) => {
    setSelectedGoal({ ...goal, remaining: goal.amount - goal.saved });
  };

  const openReward = () => {
    navigate('/Reward');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedGoal((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
      remaining: name === "amount" ? parseFloat(value) - prev.saved : prev.amount - parseFloat(value),
    }));
  };

  const handleSaveChanges = async () => {
    const { amount, saved, remaining } = selectedGoal;
    if (saved > amount) {
      alert("Saved amount cannot be greater than the total goal amount.");
      return;
    }

    if (saved > amount - remaining) {
      alert("Saved amount cannot exceed the remaining amount.");
      return;
    }

    try {
      const { _id } = selectedGoal;
      const response = await axios.put(`${API_URL}/goal/${_id}`, { amount, saved });
      alert(response.data.message || "Goal updated successfully!");

      if (saved >= amount) {
        setShowCongrats(true);
      }
      setGoals((prevGoals) =>
        prevGoals.map((goal) => (goal._id === _id ? { ...goal, amount, saved } : goal))
      );
      setSelectedGoal(null);
    } catch (error) {
      console.error("Error updating goal:", error.response?.data || error.message);
      alert("Failed to update the goal.");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this goal?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`${API_URL}/goal/${goalId}`);
      alert(response.data.message || "Goal deleted successfully!");
      setGoals((prevGoals) => prevGoals.filter((goal) => goal._id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error.response?.data || error.message);
      alert("Failed to delete the goal.");
    }
  };

  const closeCongratsModal = () => setShowCongrats(false);

  // Categorize goals
  const accomplishedGoals = goals.filter((goal) => goal.saved >= goal.amount);
  const notAccomplishedGoals = goals.filter((goal) => goal.saved < goal.amount);

  const glassCardStyle = {
    padding: '24px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
    height: '100%',
    transition: 'transform 0.3s ease',
    position: 'relative',
    '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.1)' }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="lg" sx={{ marginTop: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: "50vh" }}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        ) : error ? (
          <Box display="flex" flexDirection="column" alignItems="center" sx={{ marginTop: 4 }}>
            <img src={NoData} alt="Error" style={{ maxWidth: "200px", marginBottom: "20px" }} />
            <Typography variant="h6" fontFamily="Poppins">{error}</Typography>
          </Box>
        ) : selectedGoal ? (
          <Card sx={{ ...glassCardStyle, maxWidth: 600, margin: '20px auto' }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 3, fontFamily: 'Poppins', color: '#1F2937' }}>
              Edit Goal: {selectedGoal.name}
            </Typography>
            <TextField
              fullWidth label="Goal Amount" type="number" name="amount"
              value={selectedGoal.amount} onChange={handleInputChange}
              sx={{ marginBottom: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <TextField
              fullWidth label="Saved Amount" type="number" name="saved"
              value={selectedGoal.saved} onChange={handleInputChange}
              sx={{ marginBottom: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <Typography variant="body1" sx={{ color: "text.secondary", marginBottom: 3, fontFamily: 'Poppins' }}>
              Remaining Amount: ₱{selectedGoal.remaining.toFixed(2)}
            </Typography>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={() => setSelectedGoal(null)} sx={{ color: '#6B7280', borderRadius: '50px', textTransform: 'none' }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSaveChanges} sx={{ bgcolor: '#4F46E5', borderRadius: '50px', textTransform: 'none' }}>
                Save Changes
              </Button>
            </Box>
          </Card>
        ) : (
          <>
            {/* Accomplished Goals Section */}
            {accomplishedGoals.length > 0 && (
              <Box sx={{ marginBottom: 6 }}>
                <Typography variant="h4" sx={{
                  fontWeight: 800,
                  fontFamily: 'Poppins',
                  marginBottom: 4,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  Accomplished Goals
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                  {accomplishedGoals.map((goal) => (
                    <Grid item xs={12} sm={6} md={3} key={goal._id}>
                      <Card sx={{ ...glassCardStyle, background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)', borderColor: '#A7F3D0' }}>
                        <IconButton
                          sx={{ position: "absolute", top: 8, right: 8, color: '#EF4444' }}
                          onClick={() => handleDeleteGoal(goal._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Box display="flex" flexDirection="column" alignItems="center" py={2}>
                          <Typography variant="h5" sx={{ fontWeight: 700, marginBottom: 1, fontFamily: 'Poppins' }}>
                            {goal.name}
                          </Typography>
                          <Typography variant="body1" sx={{ color: "text.secondary", fontFamily: 'Poppins' }}>
                            Target: ₱{goal.amount.toLocaleString()}
                          </Typography>
                          <Typography variant="h6" sx={{ color: "#059669", fontWeight: 700, mt: 1, fontFamily: 'Poppins' }}>
                            Saved: ₱{goal.saved.toLocaleString()}
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() => handleEditGoal(goal)}
                            sx={{ mt: 3, borderRadius: '50px', textTransform: 'none', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Not Accomplished Goals Section */}
            {notAccomplishedGoals.length > 0 && (
              <Box>
                <Typography variant="h4" sx={{
                  fontWeight: 800,
                  fontFamily: 'Poppins',
                  marginBottom: 4,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Current Goals
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                  {notAccomplishedGoals.map((goal) => (
                    <Grid item xs={12} sm={6} md={3} key={goal._id}>
                      <Card sx={glassCardStyle}>
                        <IconButton
                          sx={{ position: "absolute", top: 8, right: 8, color: '#9CA3AF' }}
                          onClick={() => handleDeleteGoal(goal._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                          <Typography variant="h4" sx={{ fontWeight: 800, marginBottom: 1, fontFamily: 'Poppins', color: '#1F2937', textAlign: 'center' }}>
                            {goal.name}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ color: "text.secondary", marginBottom: 3, fontFamily: 'Poppins', fontWeight: 500 }}>
                            Target: ₱{goal.amount.toLocaleString()}
                          </Typography>

                          <Box width="100%" px={3} mb={2}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (goal.saved / goal.amount) * 100)}
                              sx={{
                                height: 12,
                                borderRadius: 6,
                                bgcolor: '#F3F4F6',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: '#4F46E5',
                                  borderRadius: 6
                                }
                              }}
                            />
                            <Box display="flex" justifyContent="space-between" mt={1.5}>
                              <Typography variant="body2" fontWeight="700" color="textSecondary" fontFamily="Poppins">
                                {(goal.saved / goal.amount * 100).toFixed(0)}%
                              </Typography>
                              <Typography variant="body1" fontWeight="800" color="primary" fontFamily="Poppins">
                                ₱{goal.saved.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>

                          <Button
                            variant="contained"
                            onClick={() => handleEditGoal(goal)}
                            sx={{
                              mt: 2,
                              borderRadius: '50px',
                              textTransform: 'none',
                              bgcolor: '#4F46E5',
                              color: '#fff',
                              px: 4,
                              py: 1.2,
                              fontWeight: 700,
                              fontSize: '1rem',
                              '&:hover': { bgcolor: '#4338CA', transform: 'scale(1.05)' },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Update Progress
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        )}

        {/* Congratulations Modal */}
        <Modal
          open={showCongrats}
          onClose={closeCongratsModal}
          aria-labelledby="congrats-title"
          aria-describedby="congrats-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 4,
              boxShadow: 24,
              p: 4,
              textAlign: "center",
              outline: 'none'
            }}
          >
            <Typography id="congrats-title" variant="h4" sx={{ marginBottom: 2, fontWeight: 700, color: '#10B981' }}>
              Congratulations!
            </Typography>
            <Typography id="congrats-description" variant="body1" sx={{ marginBottom: 4, fontFamily: 'Poppins', color: '#4B5563' }}>
              You've achieved your goal! Keep up the great work! Navigate to your Rewards section to claim your rewards!
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button variant="outlined" onClick={closeCongratsModal} sx={{ borderRadius: '50px', textTransform: 'none' }}>
                Close
              </Button>
              <Button variant="contained" onClick={openReward} sx={{ borderRadius: '50px', textTransform: 'none', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
                View Rewards
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </Box>
  );
};

export default MyGoal;
