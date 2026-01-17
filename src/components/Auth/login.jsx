import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/login.module.css";
import { AuthContext } from "../../context/AuthContext";
import { API_URL } from "../../apiConfig";
import LoginImg from "../../images/LoginImg.png";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Both email and password are required.");
      return;
    }

    try {
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        localStorage.setItem("token", loginData.token);

        login({
          id: loginData.user.id,
          email: loginData.user.email,
          username: loginData.user.username
        });

        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          navigate("/home");
        }, 3000);
      } else {
        setErrorMessage(loginData.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles["login-box"]}>
        <div className={styles["left-side"]}>
          <h2>Welcome Back!</h2>
          <p>Log in to continue accessing your account and goals.</p>
          <img src={LoginImg} alt="Login" style={{ maxWidth: '300px', marginBottom: '20px' }} />

        </div>
        <div className={styles["right-side"]}>
          <h2>Sign In</h2>
          <form onSubmit={handleLogin}>
            <div className={styles["input-group"]}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles["input-group"]}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles["login-button"]}>
              Sign In
            </button>
          </form>
          {errorMessage && <p className={styles["error-message"]}>{errorMessage}</p>}
          <div className={styles["signup-link"]}>

            <p>
              New user? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
      {showPopup && (
        <div className={styles["popup"]}>
          <h2>Login Successful!</h2>
          <p>Redirecting...</p>
        </div>
      )}
    </div>
  );
};

export default Login;