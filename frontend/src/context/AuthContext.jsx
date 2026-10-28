import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { clearApiCache } from "../api/axios";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hms_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("hms_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    clearApiCache();
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("hms_token", res.data.access_token);
    setUser(res.data.user);

    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    localStorage.setItem("hms_token", res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("hms_token");
    setUser(null);
    clearApiCache();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
