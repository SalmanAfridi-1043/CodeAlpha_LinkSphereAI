// VERIFIED: pages/Login.jsx — no issues found
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/Spinner";

import usePageTitle from "../hooks/usePageTitle";

const inputClass =
  "w-full glass input-field text-white rounded-xl px-4 py-3 focus:outline-none transition-all duration-300";

const labelClass = "block text-[#A0A0C0] text-xs font-semibold uppercase tracking-wider mb-2 select-none";

const Login = () => {
  usePageTitle("Sign In");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });

      localStorage.setItem("linksphereai_token", data.token);
      localStorage.setItem("linksphereai_user", JSON.stringify(data.user));
      login(data.user, data.token);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // UI UPGRADED: Login
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0A0A14, #12121F, #1A0A2E, #0A0A14)",
        backgroundSize: "400% 400%",
        animation: "bgShift 8s ease infinite"
      }}
    >
      {/* Floating particles glow effect */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#6C63FF]/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#FF6584]/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }} />

      <div className="glass w-full max-w-md rounded-[20px] shadow-[0_0_60px_rgba(108,99,255,0.15),0_0_120px_rgba(108,99,255,0.07)] p-8 border border-white/10 z-10 select-none">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">
              LinkSphere
            </span>
            <span className="text-accent">AI</span>
          </h1>
          <p className="text-[#A0A0C0] mt-2 text-sm font-medium">Welcome back to LinkSphereAI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <a
                href="#"
                className="text-xs text-primary hover:text-accent font-semibold transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0C0] hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-white rounded-xl py-3 font-semibold disabled:opacity-60 flex items-center justify-center min-h-[48px] active:scale-[0.97] transition-transform duration-100"
          >
            {loading ? <Spinner size="sm" color="#FFFFFF" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[#A0A0C0] mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-accent transition-colors font-semibold"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
