/* ─── LogoBadge — logo pill used in Navbar only ─── */
const LogoBadge = () => (
  <div
    className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl flex-shrink-0"
    style={{
      border:     "1px solid rgba(108, 99, 255, 0.33)",
      background: "linear-gradient(to right, rgba(108,99,255,0.09), rgba(255,101,132,0.07))",
      boxShadow:  "0 0 20px rgba(108,99,255,0.13)",
    }}
  >
    {/* Globe / Sphere icon */}
    <div
      className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #6C63FF, #FF6584)",
        boxShadow:  "0 0 12px rgba(108,99,255,0.4)",
      }}
    >
      <svg
        width="17" height="17" viewBox="0 0 24 24"
        fill="none" stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    </div>

    {/* Text */}
    <div className="flex items-baseline gap-[1px]">
      <span
        className="font-bold text-[15px] tracking-tight whitespace-nowrap"
        style={{
          background:            "linear-gradient(to right, #6C63FF, #FF6584)",
          WebkitBackgroundClip:  "text",
          WebkitTextFillColor:   "transparent",
          backgroundClip:        "text",
        }}
      >
        LinkSphere
      </span>
      <span className="font-bold text-[15px]" style={{ color: "#FF6584" }}>
        AI
      </span>
    </div>
  </div>
);

export default LogoBadge;
