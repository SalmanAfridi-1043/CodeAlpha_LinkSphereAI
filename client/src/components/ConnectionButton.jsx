import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

const ConnectionButton = ({ targetUserId, targetUsername, initialStatus = null }) => {
  const { user: currentUser } = useAuth();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  // Sync with initialStatus changes
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  if (!currentUser) return null;

  // Don't show connection button for oneself
  if ((currentUser?._id || currentUser || "").toString() === (targetUserId || "").toString()) {
    return null;
  }

  const handleConnect = async (e) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    const previousStatus = status;
    // Optimistic update
    setStatus("pending");

    try {
      const { data } = await api.post(`/connections/request/${targetUserId}`);
      if (data.success) {
        toast.success("Connection request sent successfully!");
      }
    } catch (err) {
      // Revert status on error
      setStatus(previousStatus);
      const message = err.response?.data?.message || "Failed to send connection request";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "accepted") {
    return (
      <button
        disabled
        className="px-4 py-2 text-xs font-semibold rounded-xl border text-[var(--muted)] border-[var(--border)] cursor-default min-h-[36px]"
        style={{ background: "transparent" }}
      >
        Connected ✓
      </button>
    );
  }

  if (status === "pending") {
    return (
      <button
        disabled
        className="px-4 py-2 text-xs font-semibold rounded-xl border text-[var(--muted)] border-[var(--border)] cursor-not-allowed min-h-[36px]"
        style={{ background: "transparent" }}
      >
        Requested ✓
      </button>
    );
  }

  // Default: null or rejected -> Connect +
  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl transition duration-300 min-h-[36px] flex items-center justify-center"
    >
      Connect +
    </button>
  );
};

export default ConnectionButton;
