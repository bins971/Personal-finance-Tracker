import React, { useState, useEffect, useContext, useCallback } from 'react';
import { API_URL } from "../../apiConfig";
import { Card, Box, Typography, CircularProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext";

const ForecastWidget = () => {
    const { user } = useContext(AuthContext);
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchForecast = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/advisor/forecast/${user.id}`);
            setForecast(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching forecast", error);
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user && user.id) {
            fetchForecast();
        }
    }, [user, fetchForecast]);

    if (loading) return <CircularProgress size={20} />;

    const trendIcon = forecast?.trend === 'up' ? <TrendingUpIcon sx={{ color: '#EF4444' }} /> :
        forecast?.trend === 'down' ? <TrendingDownIcon sx={{ color: '#10B981' }} /> :
            <TrendingFlatIcon sx={{ color: '#F59E0B' }} />;

    const trendColor = forecast?.trend === 'up' ? '#EF4444' :
        forecast?.trend === 'down' ? '#10B981' : '#F59E0B';

    const trendText = forecast?.trend === 'up' ? 'Predicted to Exceed Budget' :
        forecast?.trend === 'down' ? 'On Track to Save' : 'Stable Spending';

    return (
        <Card sx={{
            borderRadius: '24px',
            p: 3,
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.1)' }
        }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Poppins' }}>AI Prediction</Typography>
                {trendIcon}
            </Box>

            <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'Poppins' }}>
                Next 30 Days Prediction
            </Typography>

            <Typography variant="h3" fontWeight="bold" sx={{ fontFamily: 'Poppins', my: 2, color: '#1F2937' }}>
                ₱{forecast?.predictedAmount?.toLocaleString()}
            </Typography>

            <Box display="flex" alignItems="center" bgcolor="rgba(255,255,255,0.6)" p={1} borderRadius={4}>
                <Typography variant="caption" fontWeight="bold" sx={{ color: trendColor, fontFamily: 'Poppins' }}>
                    {trendText}
                </Typography>
            </Box>
        </Card>
    );
};

export default ForecastWidget;
