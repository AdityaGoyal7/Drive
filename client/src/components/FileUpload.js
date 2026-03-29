import { useState, useRef } from "react";
import axios from "axios";
import "./FileUpload.css";

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY || "35e007aaf8f88d968673";
const PINATA_SECRET  = process.env.REACT_APP_PINATA_SECRET_KEY || "50f3f2dbab4f6d3a79414dd84656a67548f8fa78bc47a616e8affffc0ca0cd78";

const FileUpload = ({ contract, account, onUploadSuccess }) => {
  const [file, setFile]         = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  /* ── File selection ── */
  const applyFile = (f) => {
    if (!f) return;
    setFile(f);
    setFileName(f.name);
  };

  const onFileInput = (e) => {
    applyFile(e.target.files[0]);
    e.preventDefault();
  };

  const clearFile = () => {
    setFile(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  /* ── Drag & drop ── */
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    applyFile(e.dataTransfer.files[0]);
  };
  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);

  /* ── Upload ── */
  const handleUpload = async (e) => {
    e?.preventDefault();
    if (!file) return;

    if (!PINATA_API_KEY || !PINATA_SECRET) {
      onUploadSuccess?.(null, "Pinata API keys not set — add them to client/.env");
      return;
    }
    if (!contract) {
      onUploadSuccess?.(null, "No smart contract connected — deploy and set REACT_APP_CONTRACT_ADDRESS");
      return;
    }
    if (!account) {
      onUploadSuccess?.(null, "Wallet not connected");
      return;
    }

    setUploading(true);
    try {
      /* 1. Pin to IPFS via Pinata */
      const formData = new FormData();
      formData.append("file", file);

      const pinataRes = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: formData,
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET,
          "Content-Type": "multipart/form-data",
        },
      });

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${pinataRes.data.IpfsHash}`;

      /* 2. Record the URL on-chain */
      const tx = await contract.add(account, ipfsUrl);
      await tx.wait(); // wait for the tx to be mined

      onUploadSuccess?.({ name: fileName, url: ipfsUrl });
      clearFile();
    } catch (err) {
      console.error("Upload error:", err);
      const msg =
        err?.response?.data?.error?.details  // Pinata API error
        || err?.reason                        // ethers revert reason
        || err?.message
        || "Unknown error";
      onUploadSuccess?.(null, msg);
    } finally {
      setUploading(false);
    }
  };

  const isDisabled = !account || uploading;

  /* ── Render ── */
  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      // Clicking the zone (not the controls) opens the file picker
      onClick={() => {
        if (!file && !uploading && account) inputRef.current?.click();
      }}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        id="file-upload"
        name="data"
        onChange={onFileInput}
        style={{ display: "none" }}
        disabled={isDisabled}
      />

      <div className="upload-icon-wrap" aria-hidden="true">
        {dragOver ? "📂" : "☁️"}
      </div>

      <div className="upload-title">
        {dragOver ? "Drop to upload" : "Upload to Vault"}
      </div>
      <div className="upload-subtitle">
        {!account
          ? "Connect your wallet to start uploading"
          : "Drag & drop a file, or click to browse — stored on IPFS, secured by blockchain"}
      </div>

      {/* Controls — stop propagation so clicks here don't also trigger zone onClick */}
      <div className="upload-controls" onClick={(e) => e.stopPropagation()}>
        <label
          htmlFor="file-upload"
          className="btn-choose"
          style={isDisabled ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" } : {}}
        >
          📁 Choose File
        </label>

        {fileName && (
          <div className="file-chip">
            <span aria-hidden="true">📄</span>
            <span className="file-chip-name" title={fileName}>{fileName}</span>
            <span
              role="button"
              aria-label="Remove file"
              tabIndex={0}
              style={{ cursor: "pointer", marginLeft: 4, color: "#7e9cc0" }}
              onClick={clearFile}
              onKeyDown={(e) => e.key === "Enter" && clearFile()}
            >
              ✕
            </span>
          </div>
        )}

        {file && (
          <button
            className="btn-upload"
            onClick={handleUpload}
            disabled={uploading || !contract}
            title={!contract ? "No contract connected" : ""}
          >
            {uploading ? "⏳ Uploading…" : "⬆ Upload"}
          </button>
        )}
      </div>

      {/* Progress indicator */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" />
          </div>
          <div className="progress-text">Pinning to IPFS → confirming on-chain…</div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
