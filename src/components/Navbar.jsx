import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import styles from '../styles/home.module.css';
import PersonIcon from '@mui/icons-material/Person';
import { Link, useNavigate } from "react-router-dom";
import GradeIcon from '@mui/icons-material/Grade';
import SmartToyIcon from '@mui/icons-material/SmartToy';


import { AuthContext } from "../context/AuthContext";

function CustomNavbar() {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const getDisplayName = () => {
        if (user?.username) return user.username.toUpperCase();
        if (user?.email) return user.email.split("@")[0].toUpperCase();
        return "FINANCE";
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('authToken');
            navigate("/");
        }
    }


    return (
        <Navbar expand="lg" className={styles.navbody} variant="light">
            <Container fluid>
                <Link to="/Dashboard" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '5px 15px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
                        boxShadow: '0 4px 15px rgba(67, 56, 202, 0.2)',
                    }}>
                        <span style={{
                            fontSize: '1.2rem',
                            fontWeight: '900',
                            color: '#FFFFFF',
                            fontFamily: 'Poppins',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase'
                        }}>
                            {getDisplayName()}'S TRACKER
                        </span>
                    </div>
                </Link>
                <Navbar.Toggle aria-controls="navbarScroll" />
                <Navbar.Collapse id="navbarScroll">
                    <Nav
                        className="me-auto my-2 my-lg-0"
                        style={{ maxHeight: '100px' }}
                        navbarScroll
                    />
                    <button id="loginbutton" onClick={handleLogout} className="btn" style={{ fontWeight: 600 }}>
                        LogOut
                    </button>

                    <div>
                        <Link to="/achievement" className={styles.profile} title="Achievements">
                            <GradeIcon />
                        </Link>
                    </div>
                    <div>
                        <Link to="/advisor" className={styles.profile} style={{ marginRight: '15px' }} title="AI Advisor">
                            <SmartToyIcon />
                        </Link>
                    </div>
                    <div>
                        <Link to="/profile" className={styles.profile}>
                            <PersonIcon />
                        </Link>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
export default CustomNavbar; 