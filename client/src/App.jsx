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
import Connect from "./pages/Connect";
import Messages from "./pages/Messages";
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
            {/* UI UPGRADED: App Toaster */}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#12121F',
                  color: '#FFFFFF',
                  border: '1px solid #2A2A40',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#00D9A3', secondary: '#12121F' }
                },
                error: {
                  iconTheme: { primary: '#FF6584', secondary: '#12121F' }
                }
              }}
            />
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
                <Route path="/connect" element={<Connect />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:userId" element={<Messages />} />
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


