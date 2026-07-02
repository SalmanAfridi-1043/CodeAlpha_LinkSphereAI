import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import ProfileQRCard from "./ProfileQRCard";

const BASE_URL =
  import.meta.env.VITE_APP_URL || "http://localhost:5173";

const ShareProfileModal = ({ isOpen, onClose, user }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  // Trap focus & close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const profileLink = `${BASE_URL}/profile/${user.username}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileLink);
      setCopied(true);
      toast.success("Link copied! 🔗", { id: "profile-copy-toast" });
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Failed to copy link");
    }
  };

  const downloadCard = () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);

    // Minor delay to ensure component render state is stable before snapshot
    setTimeout(() => {
      html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2, // High resolution output
        logging: false,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `${user.username}-linksphereai.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          toast.success("Card downloaded! 🎨");
        })
        .catch((err) => {
          console.error("Failed to capture QR Card:", err);
          toast.error("Failed to generate download");
        })
        .finally(() => {
          setDownloading(false);
        });
    }, 100);
  };

  const shareWhatsApp = () => {
    const text = `Check out @${user.username} on LinkSphereAI: ${profileLink}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const shareTwitter = () => {
    const text = `Check out @${user.username} on LinkSphereAI! 🌐✨`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileLink)}`,
      "_blank"
    );
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-[#0C0C14] border border-[#6C63FF44] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-fadeScale"
        style={{
          boxShadow: "0 0 60px rgba(108, 99, 255, 0.25)",
        }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A2A40] flex-shrink-0">
          <h2 className="text-white font-bold text-lg tracking-tight">Share Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#A0A0C0] hover:text-white hover:bg-[#2A2A40] transition duration-150"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar flex flex-col items-center gap-5">

          {/* SECTION 1 — Profile Link */}
          <div className="w-full flex flex-col text-left">
            <span className="text-[#A0A0C0] text-[11px] font-semibold uppercase tracking-wider mb-2">
              Your Profile Link
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={profileLink}
                className="flex-1 bg-[#1A1A2E] rounded-xl px-4 py-2.5 text-sm text-white border border-[#2A2A40] focus:outline-none focus:border-[#6C63FF] min-w-0"
              />
              <button
                onClick={copyLink}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition duration-150 flex-shrink-0 ${
                  copied
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* SECTION 2 — QR Card Preview */}
          <div className="w-full flex flex-col text-left">
            <span className="text-[#A0A0C0] text-[11px] font-semibold uppercase tracking-wider mb-2">
              QR Code Card
            </span>
            <div className="flex justify-center bg-[#1A1A2E] border border-[#2A2A40] rounded-2xl p-4">
              <div ref={cardRef} className="rounded-[24px] overflow-hidden bg-transparent">
                <ProfileQRCard user={user} />
              </div>
            </div>
          </div>

          {/* SECTION 3 — Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            {/* Download Card */}
            <button
              onClick={downloadCard}
              disabled={downloading}
              className="w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white hover:shadow-[0_0_20px_#6C63FF44] hover:-translate-y-0.5 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating Image...</span>
                </>
              ) : (
                <>
                  <span>⬇</span>
                  <span>Download Card</span>
                </>
              )}
            </button>

            {/* Share row */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#A0A0C0] uppercase tracking-wider font-semibold mb-2">
                Or Share Via
              </span>
              <div className="flex items-center justify-center gap-3">
                {/* WhatsApp */}
                <button
                  onClick={shareWhatsApp}
                  title="Share on WhatsApp"
                  className="w-10 h-10 rounded-full bg-[#1A1A2E] border border-[#2A2A40] hover:border-green-500 text-[#A0A0C0] hover:text-green-400 flex items-center justify-center transition duration-150"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.378 3.471 2.238 2.238 3.469 5.214 3.467 8.379-.004 6.527-5.33 11.852-11.86 11.852H11.85c-2.002-.001-3.97-.514-5.711-1.493L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.792 1.453 5.485.002 9.948-4.461 9.95-9.95.002-2.66-1.033-5.161-2.908-7.036-1.875-1.875-4.374-2.909-7.038-2.91-5.488 0-9.95 4.462-9.952 9.953-.001 1.704.453 3.371 1.314 4.839l-.999 3.647 3.743-.981zm11.367-7.854c-.29-.145-1.716-.848-1.982-.944-.266-.096-.46-.145-.653.145-.193.29-.748.944-.917 1.137-.169.193-.339.217-.629.072-2.825-1.413-4.664-3.143-5.568-4.693-.243-.418-.024-.644.185-.853.189-.188.411-.483.616-.725.203-.242.27-.411.406-.688.135-.277.067-.52-.033-.713-.099-.193-.848-2.044-1.162-2.799-.306-.734-.616-.635-.848-.647-.217-.01-.466-.013-.715-.013-.249 0-.653.093-.995.469-.342.376-1.306 1.278-1.306 3.116s1.337 3.617 1.523 3.859c.187.242 2.632 4.019 6.375 5.632.89.383 1.585.612 2.128.784.896.285 1.711.244 2.355.148.718-.107 2.213-.906 2.523-1.782.31-.876.31-1.63.217-1.782-.093-.153-.339-.249-.629-.395z" />
                  </svg>
                </button>

                {/* Twitter/X */}
                <button
                  onClick={shareTwitter}
                  title="Share on Twitter/X"
                  className="w-10 h-10 rounded-full bg-[#1A1A2E] border border-[#2A2A40] hover:border-white text-[#A0A0C0] hover:text-white flex items-center justify-center transition duration-150"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                {/* Copy Link Icon Button */}
                <button
                  onClick={copyLink}
                  title="Copy profile link"
                  className="w-10 h-10 rounded-full bg-[#1A1A2E] border border-[#2A2A40] hover:border-[#6C63FF] text-[#A0A0C0] hover:text-[#6C63FF] flex items-center justify-center transition duration-150"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareProfileModal;
