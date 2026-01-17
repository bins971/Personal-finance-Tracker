import React, { useContext, useEffect, useState } from "react";
import NavBar from "../Navbar";
import Dashboard from "./Dashboard";
import styles from "../../styles/home.module.css";
import MyGoal from "./Goal";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.js";
import { Box } from "@mui/material";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [username, setUsername] = useState("");


  useEffect(() => {
    localStorage.setItem('userEmail', user?.email);
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      const name = userEmail.split("@")[0];
      setUsername(name.charAt(0).toUpperCase() + name.slice(1));
    } else if (user?.email) {
      const name = user.email.split("@")[0];
      setUsername(name.charAt(0).toUpperCase() + name.slice(1));
    } else {
      setUsername("User");
    }
  }, [user]);

  const handleSubmit = () => {
    navigate("/addform");
  };

  const handleGoal = () => {
    navigate("/NewGoal");
  };

  return (
    <div className={styles.main}>
      <Dashboard />
    </div>
  );
};

export default Home;

