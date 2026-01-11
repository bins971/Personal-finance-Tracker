import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budget, setBudget] = useState(0);
  const { email, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchBudget = async () => {
      if (isLoggedIn && email) {
        try {
          const response = await axios.get(`/api/budget/${email}`);
          setBudget(response.data.amount);
        } catch (error) {
          console.error('Error fetching budget:', error);
        }
      }
    };

    fetchBudget();
  }, [email, isLoggedIn]);

  return (
    <BudgetContext.Provider value={{ budget, setBudget }}>
      {children}
    </BudgetContext.Provider>
  );
};
