import React, { useState, useEffect, useContext } from 'react';
import { API_URL } from "../../apiConfig";
import {
    Container, Typography, Box, Card,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Collapse, Chip, CircularProgress, Button
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext";
import styles from '../../styles/home.module.css';

const Row = ({ record }) => {
    const [open, setOpen] = useState(false);
    const archivedDate = new Date(record.archivedDate);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                    {archivedDate.toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ fontFamily: 'Poppins' }}>{archivedDate.toLocaleTimeString()}</TableCell>
                <TableCell sx={{ fontFamily: 'Poppins' }}>₱{record.totalAmount.toLocaleString()}</TableCell>
                <TableCell>
                    <Chip
                        label={`Saved ₱${record.remainingAmount.toLocaleString()}`}
                        color={record.remainingAmount > 0 ? "success" : "default"}
                        size="small"
                        sx={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    />
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle1" gutterBottom component="div" sx={{ fontFamily: 'Poppins', fontWeight: 700 }}>
                                Expense Breakdown
                            </Typography>
                            <Table size="small" aria-label="expenses">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {record.expenses.map((exp, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{exp.name}</TableCell>
                                            <TableCell>{exp.category}</TableCell>
                                            <TableCell align="right">₱{exp.amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {record.expenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">No expenses recorded for this period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const BudgetHistoryView = () => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_URL}/budget/history/${user.id}`);
                setHistory(res.data);
            } catch (err) {
                console.error("Error fetching history", err);
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) fetchHistory();
    }, [user]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className={styles.dbody}>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box display="flex" alignItems="center" mb={4}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/home')}
                        sx={{ color: '#4F46E5', textTransform: 'none', fontWeight: 600, fontFamily: 'Poppins' }}
                    >
                        Back to Dashboard
                    </Button>
                    <Typography variant="h4" sx={{ ml: 2, fontFamily: 'Poppins', fontWeight: 800, color: '#1F2937' }}>
                        Budget History
                    </Typography>
                </Box>

                <Card sx={{
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)'
                }} className={styles.fadeInUp}>
                    <TableContainer>
                        <Table aria-label="budget history table">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                                    <TableCell />
                                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Poppins' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Poppins' }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Poppins' }}>Budget Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontFamily: 'Poppins' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((record) => (
                                    <Row key={record._id} record={record} />
                                ))}
                                {history.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                            <Typography variant="body1" color="textSecondary" sx={{ fontFamily: 'Poppins' }}>
                                                No budget history found. Start your first budget to see history later!
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Container>
        </div>
    );
};

export default BudgetHistoryView;
