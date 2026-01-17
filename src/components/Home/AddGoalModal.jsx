import React, { useState, useContext } from 'react';
import { API_URL } from "../../apiConfig";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Alert, MenuItem
} from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const AddGoalModal = ({ open, onClose, onGoalAdded }) => {
    const { user } = useContext(AuthContext);
    const [goalData, setGoalData] = useState({
        name: "",
        amount: "",
        saved: "",
        description: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        priority: "Medium"
    });
    const [error, setError] = useState("");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGoalData({ ...goalData, [name]: value });
    };

    const handleSubmit = async () => {
        setError("");

        // Basic Validation
        if (!goalData.name || !goalData.amount || !goalData.endDate) {
            setError("Please fill in all required fields.");
            return;
        }

        try {
            const goalPayload = {
                email: user.email,
                ...goalData,
                amount: Number(goalData.amount),
                saved: Number(goalData.saved) || 0
            };

            const response = await axios.post(`${API_URL}/goal/usercreate`, goalPayload);
            if (response.status === 201) {
                onGoalAdded();
                onClose();
                setGoalData({
                    name: "", amount: "", saved: "", description: "",
                    startDate: new Date().toISOString().split('T')[0], endDate: "", priority: "Medium"
                });
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to create goal.");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Add New Financial Goal</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TextField
                    autoFocus margin="dense" label="Goal Name" name="name" fullWidth variant="outlined"
                    value={goalData.name} onChange={handleInputChange} required
                />
                <TextField
                    margin="dense" label="Target Amount (₱)" name="amount" type="number" fullWidth variant="outlined"
                    value={goalData.amount} onChange={handleInputChange} required
                />
                <TextField
                    margin="dense" label="Already Saved (Optional)" name="saved" type="number" fullWidth variant="outlined"
                    value={goalData.saved} onChange={handleInputChange}
                />
                <TextField
                    margin="dense" label="Start Date" name="startDate" type="date" fullWidth variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={goalData.startDate} onChange={handleInputChange}
                />
                <TextField
                    margin="dense" label="Target Date" name="endDate" type="date" fullWidth variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={goalData.endDate} onChange={handleInputChange} required
                />
                <TextField
                    margin="dense" label="Priority" name="priority" select fullWidth variant="outlined"
                    value={goalData.priority} onChange={handleInputChange}
                >
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                </TextField>
                <TextField
                    margin="dense" label="Description" name="description" multiline rows={3} fullWidth variant="outlined"
                    value={goalData.description} onChange={handleInputChange}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">Create Goal</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddGoalModal;
