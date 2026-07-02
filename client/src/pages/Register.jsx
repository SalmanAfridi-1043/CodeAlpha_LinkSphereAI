// VERIFIED: pages/Register.jsx — password strength indicator added
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/Spinner";
import usePageTitle from "../hooks/usePageTitle";

const inputClass =
  "w-full glass input-field text-white rounded-xl px-4 py-3 focus:outline-none transition-all duration-300";

const labelClass =
  "block text-[#A0A0C0] text-xs font-semibold uppercase tracking-wider mb-2 select-none";

const Register = () => {
  usePageTitle("Join LinkSphereAI");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  // SECURITY: Password strength rules — mirrors server-side validation regex
  const getPasswordRules = (pass) => [
    { test: pass.length >= 8,         msg: "At least 8 characters" },
    { test: /[A-Z]/.test(pass),       msg: "One uppercase letter" },
    { test: /[a-z]/.test(pass),       msg: "One lowercase letter" },
    { test: /\d/.test(pass),           msg: "One number" },
    { test: /[@$!%*?&]/.test(pass),   msg: "One special character (@$!%*?&)" },
  ];

  // SECURITY: All 5 rules must pass — same requirement as server
  const isPasswordStrong = (pass) =>
    getPasswordRules(pass).every((r) => r.test);

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Name is required";

    if (!username.trim()) {
      errors.username = "Username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username =
        "Username can only contain alphanumeric characters and underscores";
    }

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (!isPasswordStrong(password)) {
      // SECURITY: Enforce strong password on the client before sending to server
      errors.password = "Password must meet all the strength requirements below";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/register", {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem("linksphereai_token", data.token);
      localStorage.setItem("linksphereai_user", JSON.stringify(data.user));
      login(data.user, data.token);
      toast.success("Welcome to LinkSphereAI! 🎉");
      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // UI UPGRADED: Register + security strength indicator
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0A0A14, #12121F, #1A0A2E, #0A0A14)",
        backgroundSize: "400% 400%",
        animation: "bgShift 8s ease infinite",
      }}
    >
      {/* Floating particles glow effect */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#6C63FF]/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0" />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#FF6584]/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0"
        style={{ animationDelay: "2s" }}
      />

      <div className="glass w-full max-w-md rounded-[20px] shadow-[0_0_60px_rgba(108,99,255,0.15),0_0_120px_rgba(108,99,255,0.07)] p-8 border border-white/10 z-10 select-none">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">LinkSphere</span>
            <span className="text-accent">AI</span>
          </h1>
          <p className="text-[#A0A0C0] mt-2 text-sm font-medium">
            Join the next generation social network
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            {fieldErrors.name && (
              <p className="text-red-400 text-xs mt-1 font-semibold">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0C0]">
                @
              </span>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${inputClass} pl-8`}
              />
            </div>
            {fieldErrors.username && (
              <p className="text-red-400 text-xs mt-1 font-semibold">
                {fieldErrors.username}
              </p>
            )}
          </div>

          {/* Email */}
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
            {fieldErrors.email && (
              <p className="text-red-400 text-xs mt-1 font-semibold">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
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
            {fieldErrors.password && (
              <p className="text-red-400 text-xs mt-1 font-semibold">
                {fieldErrors.password}
              </p>
            )}
            {/* SECURITY: Live password strength indicator — visual feedback as user types */}
            {password && (
              <div className="mt-2 space-y-1 p-3 bg-[#0F0F1A]/60 rounded-xl border border-[#2A2A40]">
                {getPasswordRules(password).map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span
                      className={`transition-all duration-200 ${
                        rule.test ? "text-green-400" : "text-[#A0A0C0]"
                      }`}
                    >
                      {rule.test ? "✅" : "⭕"}
                    </span>
                    <span
                      className={`transition-colors duration-200 ${
                        rule.test ? "text-green-400" : "text-[#A0A0C0]"
                      }`}
                    >
                      {rule.msg}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0C0] hover:text-white"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1 font-semibold">
                {fieldErrors.confirmPassword}
              </p>
            )}
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
            {loading ? <Spinner size="sm" color="#FFFFFF" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-[#A0A0C0] mt-6 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:text-accent transition-colors font-semibold"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
