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
      const allowed = access.filter((item) => item.access);
      setAccessList(allowed);
    } catch (err) {
      console.error("Error fetching shared access:", err);
      setError("Failed to load shared access");
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    loadSharedAccess();
  }, [loadSharedAccess]);

  const formatAddr = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  if (loading) {
    return <div className="shared-loading">⏳ Loading accessible vaults...</div>;
  }

  if (error) {
    return <div className="shared-error">⚠️ {error}</div>;
  }

  if (accessList.length === 0) {
    return (
      <div className="shared-empty">
        <div className="shared-empty-icon">🔒</div>
        <div className="shared-empty-text">No one has shared their vault with you yet</div>
      </div>
    );
  }

  return (
    <div className="shared-container">
      <div className="shared-grid">
        {accessList.map((item, idx) => (
          <div key={idx} className="shared-card">
            <div className="shared-avatar">👤</div>
            <div className="shared-info">
              <div className="shared-addr" title={item.user}>
                {formatAddr(item.user)}
              </div>
              <div className="shared-status">✓ Access Granted</div>
            </div>
            <div className="shared-action">
              <button
                className="shared-view-btn"
                onClick={() => {
                  const input = prompt("View this vault? Enter address:", item.user);
                  if (input === item.user) {
                    window.location.hash = `#vault=${item.user}`;
                    window.location.reload();
                  }
                }}
                title="View this vault"
              >
                👁
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedWithMe;
