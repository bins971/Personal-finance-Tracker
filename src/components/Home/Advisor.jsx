import React, { useState, useContext } from 'react';
import { Container, Card, Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import styles from '../../styles/home.module.css';

const Advisor = () => {
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);

    const generateAdvice = async () => {
        setLoading(true);
        setError('');
        setAdvice('');
        try {
            const response = await axios.post('http://localhost:5000/api/advisor/advice', {
                userId: user.id
            });
            setAdvice(response.data.advice);
        } catch (err) {
            console.error(err);
            setError('Failed to generate advice. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.dbody}>
            <Container maxWidth="md" sx={{ marginTop: 4 }}>
                <Card sx={{ padding: 4, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                        <SmartToyIcon sx={{ fontSize: 40, color: '#1976d2', marginRight: 2 }} />
                        <Typography variant="h4" component="h1">
                            AI Financial Advisor
                        </Typography>
                    </Box>

                    <Typography variant="body1" sx={{ marginBottom: 3, textAlign: 'center', color: '#555' }}>
                        Get smart, personalized budgeting tips based on your current spending and savings goals.
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={generateAdvice}
                        disabled={loading}
                        sx={{ padding: '10px 30px', fontSize: '1.1rem', borderRadius: '30px' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Advice'}
                    </Button>

                    {error && (
                        <Alert severity="error" sx={{ marginTop: 3, width: '100%' }}>
                            {error}
                        </Alert>
                    )}

                    {advice && (
                        <Box sx={{ marginTop: 4, padding: 3, backgroundColor: '#f5f9ff', borderRadius: '12px', borderLeft: '5px solid #1976d2', width: '100%' }}>
                            <Typography variant="h6" sx={{ color: '#1976d2', marginBottom: 1 }}>
                                Advisor's Insight:
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.1rem', whiteSpace: 'pre-line' }}>
                                {advice}
                            </Typography>
                        </Box>
                    )}
                </Card>
            </Container>
        </div>
    );
};

export default Advisor;
