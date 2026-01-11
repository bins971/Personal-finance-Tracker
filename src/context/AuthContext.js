import { createContext, useState, useEffect ,useContext } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  
  const savedUser = localStorage.getItem("user");
  const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);
  const[isLoggedIn, setIsLoggedIn] = useState(false);
  const[email, setEmail] = useState('');
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [])

  
 useEffect(() => {
  if (user) {
    setEmail(user.email);  
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
    setEmail(''); 
  }
}, [user]);


  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, login, logout , isLoggedIn, setIsLoggedIn, email, setEmail}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
