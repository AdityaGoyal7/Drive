import { useState, useEffect, useCallback } from "react";
import "./SharedWithMe.css";

const SharedWithMe = ({ contract, account }) => {
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSharedAccess = useCallback(async () => {
    if (!contract || !account) return;

    setLoading(true);
    setError("");
    try {
      const access = await contract.shareAccess();
      // Filter only addresses with access: true
      const allowed = access.filter((item) => item.access === true);
      setAccessList(allowed);
    } catch (err) {
      console.error("Error fetching shared access:", err);
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    loadSharedAccess();
    // Refresh every 10 seconds
    const interval = setInterval(loadSharedAccess, 10000);
    return () => clearInterval(interval);
  }, [loadSharedAccess]);

  const formatAddr = (addr) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  if (loading) {
    return <div className="shared-empty">⏳ Loading...</div>;
  }

  if (error) {
    return <div className="shared-empty">⚠️ {error}</div>;
  }

  if (accessList.length === 0) {
    return (
      <div className="shared-empty">
        <div className="shared-empty-icon">🔒</div>
        <div className="shared-empty-text">No shared vaults yet</div>
      </div>
    );
  }

  return (
    <div className="shared-container">
      <div className="shared-grid">
        {accessList.map((item, idx) => (
          <div key={idx} className="shared-card">
            <div className="shared-avatar">👤</div>
            <div className="shared-addr">{formatAddr(item.user)}</div>
            <div className="shared-status">✓ Shared</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedWithMe;
