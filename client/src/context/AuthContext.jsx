// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuth();
  }, []);

  // Verificar autenticación
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
    } catch (err) {
      console.error('Error de autenticación:', err);
      localStorage.removeItem('token');
      setError(err.response?.data?.message || 'Tu sesión ha expirado');
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:5000/api/users/login', credentials);

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setUser(user);

      return true;
    } catch (err) {
      console.error('Error en login:', err);
      
      let errorMessage = 'Credenciales incorrectas';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (err.response.status === 500) {
          errorMessage = 'Error en el servidor. Intente más tarde.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message === 'Network Error') {
        errorMessage = 'No se puede conectar al servidor';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      checkAuth,
      isAdmin: user?.role === 'admin' // ✅ ← Cambio clave aquí
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};