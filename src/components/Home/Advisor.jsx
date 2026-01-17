
import React, { useState, useContext } from 'react';
import { API_URL } from "../../apiConfig";
import { Container, Card, Typography, Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Paper, Avatar, Grid, Chip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarsIcon from '@mui/icons-material/Stars';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import styles from '../../styles/home.module.css';

const Advisor = () => {
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);
    const [, setError] = useState('');
    const [openPopup, setOpenPopup] = useState(false);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const generateAdvice = async () => {
        setLoading(true);
        setError('');
        setAdvice('');
        try {
            const response = await axios.post(`${API_URL}/advisor/advice`, {
                userId: user?.id || user?._id
            });
            const adviceText = response.data.advice;
            setAdvice(adviceText);

            if (adviceText.includes("Mag tipid kana")) {
                setOpenPopup(true);
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to generate advice. Please try again later.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const glassCardStyle = {
        padding: '3rem',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '800px',
        margin: '0 auto'
    };

    return (
        <div className={styles.dbody}>
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton onClick={() => navigate('/home')} sx={{ mr: 2, color: '#4F46E5', bgcolor: 'rgba(79, 70, 229, 0.05)', '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.1)' } }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontFamily: 'Poppins', fontWeight: 800, color: '#1E1B4B' }}>
                        Financial Intelligence
                    </Typography>
                </Box>

                <Card sx={{
                    ...glassCardStyle,
                    p: 0,
                    overflow: 'hidden',
                    display: 'block', // Reset flex from glassCardStyle
                }} className={styles.fadeInUp}>
                    {/* Header Banner */}
                    <Box sx={{
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        p: 4,
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                            <PsychologyIcon sx={{ fontSize: 150 }} />
                        </Box>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)', margin: '0 auto mb 2', border: '4px solid rgba(255,255,255,0.3)' }}>
                            <SmartToyIcon sx={{ fontSize: 45 }} />
                        </Avatar>
                        <Typography variant="h4" fontWeight="800" sx={{ fontFamily: 'Poppins', mb: 1 }}>AI Wealth Advisor</Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, fontFamily: 'Poppins' }}>Your personalized financial growth engine.</Typography>
                    </Box>

                    <Box sx={{ p: 4 }}>
                        {!advice && !loading && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Grid container spacing={3} sx={{ mb: 4 }}>
                                    {[
                                        { icon: <TrendingUpIcon />, title: "Trend Analysis", desc: "Identify spending patterns over time." },
                                        { icon: <StarsIcon />, title: "Smart Tips", desc: "Actionable advice to save more." },
                                        { icon: <PsychologyIcon />, title: "Growth Mindset", desc: "Financial coaching for the future." }
                                    ].map((item, i) => (
                                        <Grid item xs={12} md={4} key={i}>
                                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(79, 70, 229, 0.03)', borderRadius: '16px', border: '1px solid rgba(79, 70, 229, 0.05)' }}>
                                                <Box sx={{ color: '#4F46E5', mb: 1 }}>{item.icon}</Box>
                                                <Typography variant="subtitle2" fontWeight="700" sx={{ fontFamily: 'Poppins' }}>{item.title}</Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>{item.desc}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Button
                                    variant="contained"
                                    onClick={generateAdvice}
                                    sx={{
                                        px: 6,
                                        py: 2,
                                        borderRadius: '50px',
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                        boxShadow: '0 10px 30px -5px rgba(79, 70, 229, 0.4)',
                                        textTransform: 'none'
                                    }}
                                >
                                    Initialize Insights
                                </Button>
                            </Box>
                        )}

                        {loading && (
                            <Box sx={{ textAlign: 'center', py: 10 }}>
                                <CircularProgress thickness={5} size={60} sx={{ color: '#4F46E5', mb: 3 }} />
                                <Typography variant="h6" sx={{ fontFamily: 'Poppins', color: '#4F46E5', fontWeight: 600 }}>Analyzing your financial footprint...</Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>Our AI is calculating trends and identifying savings opportunities.</Typography>
                            </Box>
                        )}

                        {advice && !loading && (
                            <Box className={styles.fadeInUp}>
                                <Paper elevation={0} sx={{
                                    p: 4,
                                    bgcolor: 'rgba(79, 70, 229, 0.02)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(79, 70, 229, 0.1)',
                                    position: 'relative'
                                }}>
                                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Chip
                                            icon={<SmartToyIcon style={{ color: 'white' }} />}
                                            label="Verified AI Strategy"
                                            sx={{ bgcolor: '#4F46E5', color: 'white', fontWeight: 700, p: 0.5 }}
                                        />
                                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Generated {new Date().toLocaleTimeString()}</Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{
                                        fontFamily: 'Poppins',
                                        lineHeight: 1.8,
                                        color: '#1F2937',
                                        fontSize: '1.15rem',
                                        whiteSpace: 'pre-line'
                                    }}>
                                        {advice}
                                    </Typography>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={generateAdvice}
                                        sx={{ mt: 4, borderRadius: '12px', borderStyle: 'dashed', textTransform: 'none', fontWeight: 600 }}
                                    >
                                        Refresh Insights
                                    </Button>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Card>

                <Dialog open={openPopup} onClose={() => setOpenPopup(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                    <DialogTitle sx={{ color: '#EF4444', fontWeight: 800, fontFamily: 'Poppins', fontSize: '1.5rem' }}>
                        Critical Budget Alert
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" sx={{ fontFamily: 'Poppins', color: '#4B5563' }}>
                            Our advisor has detected that you've surpassed **50% of your allocated budget**. We recommend prioritizing essential costs for the rest of the period.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenPopup(false)} variant="contained" sx={{ bgcolor: '#EF4444', borderRadius: '12px', px: 4, '&:hover': { bgcolor: '#DC2626' } }}>
                            Optimize My Spend
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </div>
    );
};

export default Advisor;
