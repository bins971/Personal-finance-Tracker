import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from "../../context/AuthContext.js";
import { API_URL } from "../../apiConfig";
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Profile = () => {
  const [editMode, setEditMode] = useState(false);
  const [edituser, setUser] = useState({
    username: '',
    email: '',
    age: '',
    gender: '',
    dob: '',
    workingStatus: '',
  });

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  console.log("**")
  console.log(user)
  localStorage.setItem('userEmail', user?.email);

  const loggedInUserEmail = localStorage.getItem('userEmail');
  console.log(loggedInUserEmail);

  const genderOptions = ['Male', 'Female', 'Other'];
  const workingStatusOptions = ['Student', 'Housewife', 'Working Professional'];
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        const response = await fetch(`${API_URL}/auth/by-profile/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        console.log("all")
        console.log(data.username)
        // ... (inside fetchUserData)
        if (response.ok) {
          setUser({
            username: data.username || '',
            email: data.email || '',
            age: data.age || '',
            gender: data.gender || '',
            dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
            workingStatus: data.workingStatus || '',
          });

          // Auto-enable edit mode if critical fields are empty
          if (!data.username || !data.age) {
            setEditMode(true);
          }
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (loggedInUserEmail) {
      fetchUserData();
    }
  }, [user?.id, user?._id, loggedInUserEmail]);
  const handleChange = (e) => {
    setUser({
      ...edituser,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditClick = () => {
    setEditMode((prev) => !prev);
  };

  const handleSave = async () => {
    if (editMode) {
      try {
        const response = await fetch(`${API_URL}/auth/update/${loggedInUserEmail}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(edituser),
        });

        if (response.ok) {
          console.log('Profile updated successfully');
        } else {
          console.error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
    setEditMode(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <IconButton
          onClick={() => navigate('/home')}
          sx={{
            color: 'white',
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'all 0.3s ease',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%) scale(1.1)' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <h2 style={styles.headerText}>Profile</h2>
      </div>
      <div style={styles.profileContainer}>
        <div style={styles.gridContainer}>
          {/* Left Column */}
          <div style={styles.fieldContainer}>
            <label>Name:</label>
            <input
              type="text"
              name="username"
              value={edituser.username}
              onChange={handleChange}
              style={{ ...styles.input, ...(!editMode ? styles.disabledInput : {}) }}
              disabled={!editMode}
            />
          </div>
          <div style={styles.fieldContainer}>
            <label>Age:</label>
            <input
              type="number"
              name="age"
              value={edituser.age}
              onChange={handleChange}
              style={{ ...styles.input, ...(!editMode ? styles.disabledInput : {}) }}
              disabled={!editMode}
            />
          </div>
          <div style={styles.fieldContainer}>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={edituser.email}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.disabledInput }}
              disabled
            />
          </div>

          {/* Right Column */}
          <div style={styles.fieldContainer}>
            <label>Gender:</label>
            <select
              name="gender"
              value={edituser.gender}
              onChange={handleChange}
              style={{ ...styles.input, ...(!editMode ? styles.disabledInput : {}) }}
              disabled={!editMode}
            >
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.fieldContainer}>
            <label>Work Profile:</label>
            <select
              name="workingStatus"
              value={edituser.workingStatus}
              onChange={handleChange}
              style={{ ...styles.input, ...(!editMode ? styles.disabledInput : {}) }}
              disabled={!editMode}
            >
              {workingStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.fieldContainer}>
            <label>Date of Birth:</label>
            <input
              type="date"
              name="dob"
              value={edituser.dob}
              onChange={handleChange}
              style={{ ...styles.input, ...(!editMode ? styles.disabledInput : {}) }}
              disabled={!editMode}
            />
          </div>
        </div>

        <button onClick={handleEditClick} style={styles.editButton}>
          {editMode ? 'Cancel' : 'Edit'}
        </button>
        {editMode && (
          <button onClick={handleSave} style={styles.saveButton}>
            Save
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '90%',
    maxWidth: '1000px',
    margin: '40px auto 80px auto', // Added bottom margin to avoid cut-off
    padding: '40px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    boxShadow: 'var(--glass-shadow)',
    border: '1px solid var(--glass-border)',
  },
  header: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
    padding: '30px',
    borderRadius: '20px',
    color: 'white',
    textAlign: 'center',
    marginBottom: '40px',
    boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
    position: 'relative', // Added for absolute positioning of back button
  },
  headerText: {
    margin: 0,
    fontSize: '2.5rem',
    fontWeight: 700,
    fontFamily: 'Poppins',
  },
  profileContainer: {
    marginTop: '20px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive grid
    gap: '30px',
  },
  fieldContainer: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '16px',
    marginTop: '8px',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '1rem',
    backgroundColor: 'rgba(255,255,255,0.4)',
    fontFamily: 'Poppins',
    transition: 'all 0.2s ease',
  },
  disabledInput: {
    backgroundColor: 'rgba(200,200,200,0.3)',
    cursor: 'not-allowed',
    color: '#555',
  },
  editButton: {
    padding: '12px 30px',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '30px',
    fontFamily: 'Poppins',
    transition: 'all 0.3s ease',
  },
  saveButton: {
    padding: '12px 30px',
    backgroundColor: 'var(--secondary)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '30px',
    marginLeft: '15px',
    fontFamily: 'Poppins',
    transition: 'all 0.3s ease',
  },
};

export default Profile;
