
import React from 'react';
import { Container, Button, AppBar, Toolbar, Box, Typography } from '@mui/material';
import { Link } from "react-router-dom";
import styles from '../styles/home.module.css';
import Home2 from "../images/Home2.png";
import Home3 from "../images/Home3.png";
import Home4 from "../images/Home4.png";
import Home5 from "../images/Home5.png";

function Page() {
    return (
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh' }}>
            <AppBar position="static" className={styles.navbody} style={{ background: 'transparent', boxShadow: 'none' }}>
                <Toolbar>
                    <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontFamily: 'Poppins',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                background: 'linear-gradient(45deg, #4F46E5, #10B981)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Smart Expense Tracker
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Button
                                    sx={{
                                        borderRadius: '50px',
                                        textTransform: 'none',
                                        color: 'var(--primary)',
                                        background: 'rgba(255,255,255,0.8)',
                                        padding: '10px 25px',
                                        fontWeight: 600,
                                        fontFamily: 'Poppins',
                                        border: '1px solid var(--primary)',
                                        '&:hover': {
                                            background: 'white',
                                            transform: 'translateY(-2px)'
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Log In
                                </Button>
                            </Link>

                            <Link to="/signup" style={{ textDecoration: 'none' }}>
                                <Button
                                    variant="contained"
                                    sx={{
                                        borderRadius: '50px',
                                        textTransform: 'none',
                                        background: 'var(--primary)',
                                        padding: '10px 25px',
                                        fontWeight: 600,
                                        fontFamily: 'Poppins',
                                        boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
                                        '&:hover': {
                                            background: 'var(--primary-light)',
                                            boxShadow: '0 6px 20px rgba(79, 70, 229, 0.23)',
                                            transform: 'translateY(-2px)'
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Sign Up
                                </Button>
                            </Link>
                        </Box>
                    </Container>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ padding: '0 !important', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Hero Section */}
                <Box sx={{
                    textAlign: 'center',
                    padding: '80px 20px 40px',
                    maxWidth: '900px',
                    animation: 'fadeIn 1s ease-out'
                }}>
                    <Typography variant="h2" sx={{
                        fontFamily: 'Poppins',
                        fontWeight: 800,
                        color: '#1F2937',
                        mb: 2,
                        lineHeight: 1.2
                    }}>
                        Smart Expense Tracker & <span style={{ color: '#4F46E5' }}>Budget Advisor System</span>
                    </Typography>
                    <Typography variant="h5" sx={{
                        fontFamily: 'Poppins',
                        color: '#4B5563',
                        mb: 5,
                        fontWeight: 400
                    }}>
                        Take control of your financial future with AI-powered insights and smart budgeting.
                    </Typography>
                </Box>

                {/* Images Container */}
                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: { xs: '30px', md: '50px' }, // Responsive gap
                    padding: { xs: '0 10px', md: '0' } // Padding for small screens
                }}>
                    <img src={Home2} alt="Dashboard Preview" className={styles.imagefullscreen} style={{ width: '100%', maxWidth: '1400px', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <img src={Home3} alt="Features" className={styles.imagefullscreen} style={{ width: '100%', maxWidth: '1400px', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <img src={Home4} alt="Analytics" className={styles.imagefullscreen} style={{ width: '100%', maxWidth: '1400px', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <img src={Home5} alt="Mobile View" className={styles.imagefullscreen} style={{ width: '100%', maxWidth: '1400px', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </Box>

                {/* Footer Tagline */}
                <Box sx={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.5)',
                    width: '100%',
                    backdropFilter: 'blur(10px)',
                    marginTop: '50px'
                }}>
                    <Typography variant="h4" sx={{
                        fontFamily: 'Poppins',
                        fontWeight: 700,
                        color: '#FF7F50', // Coral/Orange color
                        fontStyle: 'italic'
                    }}>
                        Take control of your finances today. Small steps lead to big savings tomorrow!
                    </Typography>
                </Box>

            </Container>

            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}
            </style>
        </div>
    );
}

export default Page;
