import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton, Card, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext";
import { API_URL } from "../../apiConfig";

const Subscriptions = () => {
    const { user } = useContext(AuthContext);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newSub, setNewSub] = useState({ name: '', amount: '', cycle: 'Monthly', category: 'Subscription', startDate: new Date().toISOString().split('T')[0] });

    const fetchSubscriptions = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/subscription/get/${user.id}`);
            setSubscriptions(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching subscriptions", error);
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        if (user && user.id) {
            fetchSubscriptions();
        }
    }, [user, fetchSubscriptions]);

    const handleAdd = async () => {
        try {
            const res = await axios.post(`${API_URL}/subscription/add`, { ...newSub, user: user.id });
            setSubscriptions([...subscriptions, res.data]);
            setOpen(false);
            setNewSub({ name: '', amount: '', cycle: 'Monthly', category: 'Subscription', startDate: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error adding subscription", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/subscription/delete/${id}`);
            setSubscriptions(subscriptions.filter(sub => sub._id !== id));
        } catch (error) {
            console.error("Error deleting subscription", error);
        }
    };

    const getTotalMonthly = () => {
        if (!Array.isArray(subscriptions)) return 0;
        return subscriptions.reduce((acc, sub) => {
            return acc + (sub.cycle === 'Monthly' ? sub.amount : sub.amount / 12);
        }, 0);
    };

    return (
        <Card sx={{
            borderRadius: '24px',
            p: 3,
            height: '100%',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.1)' }
        }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Poppins' }}>Subscriptions</Typography>
                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    sx={{ borderRadius: '20px', textTransform: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                    onClick={() => setOpen(true)}
                >
                    Add
                </Button>
            </Box>

            <Box mb={2}>
                <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'Poppins' }}>Est. Monthly Cost</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary" sx={{ fontFamily: 'Poppins' }}>
                    ₱{getTotalMonthly().toFixed(2)}
                </Typography>
            </Box>

            <Box sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                {loading ? <CircularProgress size={24} /> : subscriptions.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" align="center" mt={2}>No subscriptions yet.</Typography>
                ) : (
                    subscriptions.map(sub => (
                        <Box key={sub._id} display="flex" justifyContent="space-between" alignItems="center" p={1.5} mb={1} sx={{ bgcolor: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight="600">{sub.name}</Typography>
                                <Typography variant="caption" color="textSecondary">{sub.cycle} • Next: {new Date(sub.nextPaymentDate).toLocaleDateString()}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                                <Typography variant="subtitle2" fontWeight="bold" mr={1}>₱{sub.amount}</Typography>
                                <IconButton size="small" color="error" onClick={() => handleDelete(sub._id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle sx={{ fontFamily: 'Poppins' }}>Add Subscription</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name (e.g., Netflix)"
                        fullWidth
                        value={newSub.name}
                        onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Amount"
                        type="number"
                        fullWidth
                        value={newSub.amount}
                        onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Cycle"
                        fullWidth
                        value={newSub.cycle}
                        onChange={(e) => setNewSub({ ...newSub, cycle: e.target.value })}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="Monthly">Monthly</MenuItem>
                        <MenuItem value="Yearly">Yearly</MenuItem>
                    </TextField>
                    <TextField
                        select
                        margin="dense"
                        label="Category"
                        fullWidth
                        value={newSub.category || 'Subscription'}
                        onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="Subscription">Subscription</MenuItem>
                        <MenuItem value="Entertainment">Entertainment</MenuItem>
                        <MenuItem value="Utility">Utility</MenuItem>
                        <MenuItem value="Work">Work</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Start Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={newSub.startDate}
                        onChange={(e) => setNewSub({ ...newSub, startDate: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default Subscriptions;
