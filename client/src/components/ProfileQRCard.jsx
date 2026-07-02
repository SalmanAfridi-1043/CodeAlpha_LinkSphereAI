import React from "react";
import { QRCodeSVG } from "qrcode.react";
import Avatar from "./Avatar";

const BASE_URL =
  import.meta.env.VITE_APP_URL || "http://localhost:5173";

const ProfileQRCard = ({ user }) => {
  if (!user) return null;

  const { name, username, bio, isVerified, followers, following, postsCount } = user;

  return (
    <div
      className="w-72 rounded-[24px] p-[28px] flex flex-col items-center border border-[#6C63FF44] bg-gradient-to-b from-[#0A0A14] to-[#1A0A2E] select-none text-center"
      style={{
        boxShadow: "0 0 60px rgba(108, 99, 255, 0.2)",
      }}
    >
      {/* 1. App branding row */}
      <div className="w-full flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5">
          {/* Globe/Sphere icon */}
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#6C63FF] to-[#FF6584] shadow-[0_0_8px_rgba(108,99,255,0.4)]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          {/* Brand Text */}
          <div className="flex items-baseline gap-[0.5px]">
            <span className="font-bold text-xs tracking-tight bg-gradient-to-r from-[#6C63FF] to-[#FF6584] bg-clip-text text-transparent">
              LinkSphere
            </span>
            <span className="font-bold text-xs text-[#FF6584]">AI</span>
          </div>
        </div>
        <span className="text-[10px] text-[#A0A0C0] font-semibold uppercase tracking-wider opacity-75">
          Scan to connect
        </span>
      </div>

      {/* 2. User Avatar */}
      <div className="mb-4">
        <Avatar
          user={user}
          size="xl"
          showRing={true}
          className="border-4 border-[#0A0A14]"
        />
      </div>

      {/* 3. Name Row */}
      <div className="flex items-center justify-center gap-1.5 w-full">
        <h2 className="text-white font-bold text-xl leading-tight truncate max-w-[180px]">
          {name}
        </h2>
        {isVerified && (
          <svg
            className="w-5 h-5 text-[#6C63FF] fill-current flex-shrink-0"
            viewBox="0 0 24 24"
            aria-label="Verified User"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
      </div>

      {/* 4. Username */}
      <p className="text-[#A0A0C0] text-sm mt-0.5 font-medium">@{username}</p>

      {/* 5. Bio */}
      <p className="text-[#A0A0C0]/80 text-xs mt-2 px-1 truncate w-full">
        {bio || "No bio available"}
      </p>

      {/* 6. QR Code Wrapper */}
      <div className="bg-white p-3 rounded-2xl shadow-lg my-5 flex items-center justify-center">
        <QRCodeSVG
          value={`${BASE_URL}/profile/${username}`}
          size={140}
          bgColor="#FFFFFF"
          fgColor="#6C63FF"
          level="H"
          includeMargin={false}
        />
      </div>

      {/* 7. Stats row */}
      <div className="w-full grid grid-cols-3 gap-1 border-t border-[#6C63FF22] pt-4 mb-3">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-white leading-tight">
            {postsCount || 0}
          </span>
          <span className="text-[10px] text-[#A0A0C0] font-semibold uppercase tracking-wider mt-0.5">
            Posts
          </span>
        </div>
        <div className="flex flex-col items-center border-x border-[#6C63FF22]">
          <span className="text-sm font-bold text-white font-mono leading-tight">
            {followers?.length || 0}
          </span>
          <span className="text-[10px] text-[#A0A0C0] font-semibold uppercase tracking-wider mt-0.5">
            Followers
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-white font-mono leading-tight">
            {following?.length || 0}
          </span>
          <span className="text-[10px] text-[#A0A0C0] font-semibold uppercase tracking-wider mt-0.5">
            Following
          </span>
        </div>
      </div>

      {/* 8. Bottom bar */}
      <div className="text-[9px] text-[#A0A0C0]/60 font-mono tracking-wider">
        linksphereai.vercel.app
      </div>
    </div>
  );
};

export default ProfileQRCard;
