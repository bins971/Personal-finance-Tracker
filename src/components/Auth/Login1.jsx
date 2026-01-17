import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/login.module.css";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../apiConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsLoggedIn, setEmail: setAuthEmail } = useAuth();

  // Load email from localStorage if available
  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!email || !password) {
      setMessage("Email and password are required.");
      setLoading(false);
      return;
    }

    const loginUrl = `${API_URL}/auth/login`;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.authToken);
        localStorage.setItem("email", email);
        setAuthEmail(email);
        setMessage("Login successful! Redirecting...");
        setIsLoggedIn(true);

        setTimeout(() => {
          navigate("/"); // Redirect after successful login
        }, 2000);
      } else {
        // Handle different error scenarios
        if (data.errors) {
          setMessage(data.errors[0] || "Login failed. Please try again.");
        } else {
          setMessage("Login failed. Please try again.");
        }
      }
    } catch (error) {
      setMessage("An error occurred while logging in. Please try again later.");
      console.error("Login error:", error);
    } finally {
      setLoading(false); // Stop loading after the request completes
    }
  };

  return (
    <div className={styles.loginPage}> {/* Use CSS module styles */}
      <div className={styles.loginBox}> {/* Use CSS module styles */}
        <h2>Sign In</h2>
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}> {/* Use CSS module styles */}
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}> {/* Use CSS module styles */}
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"} {/* Show loading text */}
          </button>
        </form>

        {message && (
          <div className={`${styles.message} ${message.includes("successful") ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <div className={styles.signupLink}>
          <p>
            New user? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
