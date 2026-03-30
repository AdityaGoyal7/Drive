import { useState, useCallback } from "react";
import "./Display.css";

const Display = ({ contract, account, onDelete }) => {
  const [items, setItems]       = useState([]);
  const [searchAddr, setSearchAddr] = useState("");
  const [activeAddress, setActiveAddress] = useState("");
  const [isOwner, setIsOwner]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);
  const [error, setError]       = useState("");

  /* ── URL helpers ── */
  const toGatewayUrl = (raw) => {
    if (!raw) return "";
    if (raw.startsWith("https://")) return raw;
    // ipfs://Qm... → gateway URL
    const hash = raw.startsWith("ipfs://") ? raw.slice(7) : raw;
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  };

  const shortLabel = (raw, index) => {
    const hash = raw.startsWith("ipfs://")
      ? raw.slice(7)
      : raw.split("/ipfs/")[1] ?? raw;
    return hash.length > 14 ? `${hash.slice(0, 10)}…` : `file-${index + 1}`;
  };

  /* ── Fetch from chain ── */
  const loadVault = useCallback(async () => {
    if (!contract) {
      setError("No contract connected — deploy first and set REACT_APP_CONTRACT_ADDRESS.");
      setFetched(true);
      return;
    }
    setLoading(true);
    setFetched(false);
    setError("");
    setItems([]);

    try {
      const target = searchAddr.trim() || account;
      const normalizedAccount = account?.toLowerCase() || "";
      setActiveAddress(target);
      setIsOwner(target.toLowerCase() === normalizedAccount);

      const raw = await contract.display(target);   // string[]

      if (!raw || raw.length === 0) {
        setItems([]);
      } else {
        setItems(
          raw.map((url, i) => ({
            raw: url,
            displayUrl: toGatewayUrl(url),
            label: shortLabel(url, i),
          }))
        );
      }
    } catch (err) {
      console.error("display() error:", err);
      // Solidity reverts with "You don't have access"
      const msg =
        err?.error?.message ||
        err?.reason ||
        err?.message ||
        "Could not load vault";
      setError(msg.includes("don't have access")
        ? "Access denied — you don't have permission to view this vault."
        : msg);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [contract, account, searchAddr]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") loadVault();
  };

  const removeItem = async (index) => {
    if (!contract) {
      setError("No contract connected");
      return;
    }
    if (!account) {
      setError("Connect wallet to remove files");
      return;
    }
    if (!isOwner) {
      setError("Only vault owner can remove files");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const tx = await contract.remove(index);
      await tx.wait();

      // Reload current view so ordering stays consistent after removal
      setTimeout(() => loadVault(), 500);

      if (onDelete) {
        onDelete("Image removed from vault");
      }
    } catch (err) {
      console.error("remove() error:", err);
      setError(err?.reason || err?.message || "Failed to remove file");
    } finally {
      setLoading(false);
    }
  };

  /* ── Copy helper ── */
  const copyLink = (url) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  /* ── Render ── */
  return (
    <div>
      {/* Search bar */}
      <div className="viewer-controls">
        <div className="address-input-wrap">
          <span className="address-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="address-input"
            placeholder="Enter wallet address to view their vault (or leave blank for yours)…"
            value={searchAddr}
            onChange={(e) => setSearchAddr(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <button
          className="btn-getdata"
          onClick={loadVault}
          disabled={loading || !contract}
          title={!contract ? "No contract connected" : "Load vault"}
        >
          {loading ? "⏳ Loading…" : "→ Load Vault"}
        </button>
      </div>

      {/* Error state */}
      {fetched && error && (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-text" style={{ color: "var(--danger)" }}>{error}</div>
        </div>
      )}

      {/* Empty state */}
      {fetched && !error && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🗄️</div>
          <div className="empty-state-text">This vault is empty.</div>
        </div>
      )}

      {/* File grid */}
      {items.length > 0 && (
        <div className="image-grid" style={{ marginTop: 16 }}>
          {items.map((item, i) => (
            <FileCard
              key={i}
              item={item}
              onCopy={copyLink}
              isOwner={isOwner}
              onRemove={() => removeItem(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── FileCard — isolated so onError has a stable ref to its own div ── */
const FileCard = ({ item, onCopy, isOwner, onRemove }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="image-card">
      <a href={item.displayUrl} target="_blank" rel="noreferrer">
        {!imgFailed ? (
          <img
            src={item.displayUrl}
            alt={item.label}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              background: "rgba(79,142,247,0.06)",
            }}
          >
            📄
          </div>
        )}
      </a>
      <div className="image-card-footer">
        <span className="image-card-name" title={item.raw}>{item.label}</span>
        <div className="image-card-actions">
          <a
            href={item.displayUrl}
            target="_blank"
            rel="noreferrer"
            className="icon-btn"
            title="Open in new tab"
          >↗</a>
          <button
            className="icon-btn"
            title="Copy IPFS link"
            onClick={() => onCopy(item.displayUrl)}
          >⧉</button>
          {isOwner && (
            <button
              className="icon-btn"
              title="Remove file from vault"
              onClick={onRemove}
              style={{ color: "#e74c3c" }}
            >🗑</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Display;
