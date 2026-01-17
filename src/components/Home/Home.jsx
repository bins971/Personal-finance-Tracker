import React, { useContext, useEffect } from "react";
import Dashboard from "./Dashboard";
import styles from "../../styles/home.module.css";
import { AuthContext } from "../../context/AuthContext.js";

const Home = () => {
  const { user } = useContext(AuthContext);


  useEffect(() => {
    localStorage.setItem('userEmail', user?.email);
  }, [user]);

  return (
    <div className={styles.main}>
      <Dashboard />
    </div>
  );
};

export default Home;

