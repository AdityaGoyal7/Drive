import { useEffect, useState, useRef } from "react";
import "./Modal.css";

const Modal = ({ setModalOpen, contract, addToast }) => {
  const [address, setAddress]     = useState("");
  const [accessList, setAccessList] = useState([]);
  const [fetching, setFetching]   = useState(true);
  const [granting, setGranting]   = useState(false);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load the current access list
  useEffect(() => {
    if (!contract) return;
    const load = async () => {
      setFetching(true);
      try {
        const list = await contract.shareAccess();
        // list is an array of { user: string, access: bool }
        setAccessList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("shareAccess() failed:", err);
        setAccessList([]);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [contract]);

  const handleGrant = async () => {
    const trimmed = address.trim();
    if (!trimmed || !contract) return;

    // Basic address format check before hitting the chain
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      addToast?.("Invalid Ethereum address — must be 0x followed by 40 hex characters", "error");
      return;
    }

    setGranting(true);
    try {
      const tx = await contract.allow(trimmed);
      await tx.wait();

      // Refresh list after the tx confirms
      const updated = await contract.shareAccess();
      setAccessList(Array.isArray(updated) ? updated : []);
      setAddress("");
      addToast?.(`Access granted to ${trimmed.slice(0, 8)}…`, "success");
    } catch (err) {
      console.error("allow() failed:", err);
      addToast?.(err.reason || err.message || "Failed to grant access", "error");
    } finally {
      setGranting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")  handleGrant();
    if (e.key === "Escape") setModalOpen(false);
  };

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setModalOpen(false);
  };

  const fmtAddr = (addr) =>
    addr && addr.length > 20
      ? `${addr.slice(0, 10)}…${addr.slice(-6)}`
      : addr ?? "—";

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Share vault access">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="modal-title-icon" aria-hidden="true">🔗</div>
            Share Access
          </div>
          <button
            className="modal-close"
            onClick={() => setModalOpen(false)}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-label">Grant access to wallet address</div>
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            placeholder="0x..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
          />

          <div className="access-list-label">
            People with access
            {fetching && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>loading…</span>}
          </div>

          <div className="access-list">
            {!fetching && accessList.length === 0 && (
              <div className="access-empty">🔒 No shared access yet</div>
            )}
            {accessList.map((item, i) => (
              <div key={i} className="access-item">
                <span className="access-addr" title={item.user}>{fmtAddr(item.user)}</span>
                <span className={`access-badge ${item.access ? "granted" : "revoked"}`}>
                  {item.access ? "Granted" : "Revoked"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={() => setModalOpen(false)}>
            Cancel
          </button>
          <button
            className="btn-grant"
            onClick={handleGrant}
            disabled={!address.trim() || granting}
          >
            {granting ? "Confirming…" : "✓ Grant Access"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
