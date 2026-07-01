import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import useAuth from "./hooks/useAuth";
import Spinner from "./components/Spinner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Explore from "./pages/Explore";
import NotificationsPage from "./pages/NotificationsPage";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";

import { SocketProvider } from "./context/SocketContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private routes wrapped in AppLayout and ErrorBoundary */}
              <Route
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <AppLayout />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              >
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;


