// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);


  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);


  useEffect(() => {
  if (user) {
    const newSocket = io('http://localhost:3000'); // adjust if using remote server
    newSocket.emit('register', user.accountid); // use user._id or user.user_id depending on your backend
    newSocket.on('notification', (data) => {
      console.log('Notification received:', data);
      // optionally show toast or update notification state here
      toast.info(`${data.message}`, {
        position: 'top-right',
        autoClose: 200000,
        pauseOnHover: true,
        draggable: true,
        closeOnClick: true
      });
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }
}, [user]);


  const login = (token, userData) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
