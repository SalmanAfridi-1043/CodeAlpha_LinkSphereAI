import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("linksphereai_token");
    const storedUser = localStorage.getItem("linksphereai_user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("linksphereai_user");
      }
    }

    setLoading(false);
  }, []);

  const login = (userData, tokenData) => {
    localStorage.setItem("linksphereai_token", tokenData);
    localStorage.setItem("linksphereai_user", JSON.stringify(userData));
    setUser(userData);
    setToken(tokenData);
  };

  const logout = () => {
    localStorage.removeItem("linksphereai_token");
    localStorage.removeItem("linksphereai_user");
    setUser(null);
    setToken(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem("linksphereai_user", JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
