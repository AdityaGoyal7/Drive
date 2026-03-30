import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display";
import Modal from "./components/Modal";
import SharedWithMe from "./components/SharedWithMe";
import TransactionPanel from "./components/TransactionPanel";
import "./App.css";

// ABI is inlined to avoid path resolution issues on CI/deployment when artifacts are not available.
const Upload = {
  abi: [
    {
      inputs: [
        { internalType: "address", name: "_user", type: "address" },
        { internalType: "string", name: "url", type: "string" }
      ],
      name: "add",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        { internalType: "address", name: "user", type: "address" }
      ],
      name: "allow",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        { internalType: "address", name: "user", type: "address" }
      ],
      name: "disallow",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        { internalType: "address", name: "_user", type: "address" }
      ],
      name: "display",
      outputs: [
        { internalType: "string[]", name: "", type: "string[]" }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        { internalType: "uint256", name: "index", type: "uint256" }
      ],
      name: "remove",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "shareAccess",
      outputs: [
        {
          components: [
            { internalType: "address", name: "user", type: "address" },
            { internalType: "bool", name: "access", type: "bool" }
          ],
          internalType: "struct Upload.Access[]",
          name: "",
          type: "tuple[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    }
  ]
};

// ⚠️  Replace with your deployed contract address, or set REACT_APP_CONTRACT_ADDRESS in client/.env

  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x58Dd530de8eF92C73E3E77539Ba0473713C310d6";

/* ─── Toast system ──────────────────────────────────────────────── */
let _toastId = 0;

const ToastContainer = ({ toasts, onRemove }) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div key={t.id} className={`toast ${t.type}`} onClick={() => onRemove(t.id)}>
        <span className="toast-icon">
          {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
        </span>
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);

/* ─── App ───────────────────────────────────────────────────────── */
function App() {
  const [account, setAccount]       = useState("");
  const [contract, setContract]     = useState(null);
  const [provider, setProvider]     = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [toasts, setToasts]         = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [fileCount, setFileCount]   = useState(0);
  const [transactions, setTransactions] = useState([]);

  // Keep a stable ref to addToast so connectWallet (called once in useEffect)
  // doesn't need addToast as a dep and avoids the stale-closure / infinite-loop trap.
  const addToastRef = useRef(null);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  // Add transaction
  const addTransaction = useCallback((message, type = "info", duration = 6000) => {
    const txId = Date.now();
    const tx = { id: txId, message, type, timestamp: new Date() };
    setTransactions((prev) => [tx, ...prev.slice(0, 4)]); // Keep last 5
    setTimeout(() => setTransactions((prev) => prev.filter((t) => t.id !== txId)), duration);
  }, []);

  // Keep ref in sync
  addToastRef.current = addToast;

  const removeToast = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  /* ── wallet connection ── */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      addToastRef.current("MetaMask is not installed — please add it to your browser", "error", 6000);
      return;
    }
    setConnecting(true);
    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);

      // Only register listeners once (idempotent on MetaMask side)
      window.ethereum.removeAllListeners("chainChanged");
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.on("chainChanged", () => window.location.reload());
      window.ethereum.on("accountsChanged", () => window.location.reload());

      await web3Provider.send("eth_requestAccounts", []);
      const signer  = web3Provider.getSigner();
      const addr    = await signer.getAddress();
      setAccount(addr);
      setProvider(web3Provider);

      if (CONTRACT_ADDRESS === "Your Contract Address Here") {
        addToastRef.current(
          "⚠️  No contract address set",
          "info",
          10000
        );
        // Don't set contract — upload/display will stay disabled
      } else {
        const uploadContract = new ethers.Contract(CONTRACT_ADDRESS, Upload.abi, signer);
        setContract(uploadContract);
        addToastRef.current("Wallet connected", "success");
      }
    } catch (err) {
      // User rejected the request (code 4001) vs other errors
      if (err.code === 4001) {
        addToastRef.current("Connection rejected by user", "error");
      } else {
        console.error("Wallet connection error:", err);
        addToastRef.current("Failed to connect wallet — check the console for details", "error");
      }
    } finally {
      setConnecting(false);
    }
  }, []); // no deps — uses ref for addToast

  // Auto-connect on mount if MetaMask already approved
  useEffect(() => {
    if (window.ethereum) {
      // Check if already authorised without prompting
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch(() => {});
    }
  }, [connectWallet]);

  /* ── upload callback ── */
  const handleUploadResult = useCallback(
    (result, errorMsg) => {
      if (errorMsg) {
        addToast(`Upload failed: ${errorMsg}`, "error");
      } else if (result) {
        addToast(`✓ "${result.name}" uploaded successfully!`, "success");
        setFileCount((n) => n + 1);
      }
    },  addTransaction(status, "error", 4000);
      } else if (status.includes("✓")) {
        addToast(status, "success", 3000);
        addTransaction(status, "success", 4000);
      } else {
        addToast(status, "info", 2000);
        addTransaction(status, "info", 2000);
      }
    },
    [addToast, addTransactiontus.includes("failed") || status.includes("error")) {
        addToast(status, "error", 3000);
      } else if (status.includes("✓")) {
        addToast(status, "success", 3000);
      } else {
        addToast(status, "info", 2000);
      }
    },
    [addToast]
  );

  /* ── helpers ── */
  const formatAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "Not connected";

  /* ── render ── */
  return (
    <div className="app-shell">
      {/* Ambient background orbs */}
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── Top bar ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon" aria-hidden="true">⚡</div>
          <span className="brand-name">VaultHub</span>
          <span className="brand-badge">Web3</span>
        </div>

        <div className="topbar-right">
          {account ? (
            <>
              <div className="wallet-chip" title={account}>
                <div className="wallet-dot" />
                <span className="wallet-addr">{formatAddr(account)}</span>
              </div>
              <button
                className="btn-share"
                onClick={() => setModalOpen(true)}
                disabled={!contract}
                title={!contract ? "No contract connected" : "Share vault access"}
              >
                🔗 Share Access
              </button>
            </>
          ) : (
            <button
              className="btn-share"
              onClick={connectWallet}
              disabled={connecting}
            >
              {connecting ? "⏳ Connecting…" : "🔌 Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="main-content">
        {/* Left Sidebar - About & Info */}
        <aside className="sidebar">
          <div className="sidebar-content">
            <div className="about-card">
              <div className="about-icon">🌐</div>
              <h2>VaultHub</h2>
              <p className="about-tagline">Your Web3 Secure Storage</p>
              <div className="about-description">
                <p>Store your files permanently on IPFS with blockchain verification. Share access with others through Ethereum addresses. Complete control, zero intermediaries.</p>
              </div>
            </div>

            <div className="features-card">
              <h3>How It Works</h3>
              <div className="feature-item">
                <div className="feature-number">1</div>
                <div>
                  <h4>Upload</h4>
                  <p>Select a file and upload to IPFS through Pinata</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">2</div>
                <div>
                  <h4>Record</h4>
                  <p>Your file URL gets recorded on the blockchain</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">3</div>
                <div>
                  <h4>Share</h4>
                  <p>Grant access to others via their wallet address</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">4</div>
                <div>
                  <h4>Manage</h4>
                  <p>Delete entries or revoke access anytime</p>
                </div>
              </div>
            </div>

            <div className="tech-card">
              <h3>Built With Web3</h3>
              <div className="tech-badges">
                <span className="tech-badge">Ethereum</span>
                <span className="tech-badge">IPFS</span>
                <span className="tech-badge">Solidity</span>
                <span className="tech-badge">Web3.js</span>
              </div>
            </div>
          </div>
        </aside>
Transaction History Panel */}
          {transactions.length > 0 && <TransactionPanel transactions={transactions} />
        {/* Right Content - Main Workspace */}
        <main className="workspace">
          {/* Upload */}
          <section>
            <div className="section-header">
              <div className="section-title">⬆ Upload File</div>
              <div className="section-description">Pin your files to IPFS, verified on blockchain</div>
            </div>
            <FileUpload
              account={account}
              provider={provider}
              contract={contract}
              onUploadSuccess={handleUploadResult}
              onUploadProgress={handleUploadProgress}
            />
          </section>

          {/* Vault viewer */}
          <section>
            <div className="section-header">
              <div className="section-title">
                🗄 Vault Contents
                {fileCount > 0 && (
                  <span className="section-count">{fileCount} new</span>
                )}
              </div>
              <div className="section-description">Manage your stored files and access permissions</div>
            </div>{
                addToast(msg, "success");
                addTransaction(msg, "success", 5000);
              }
            <Display
              contract={contract}
              account={account}
              onDelete={(msg) => addToast(msg, "success")}
            />
          </section>

          {/* Shared with me section */}
          {account && (
            <section>
              <div className="section-header">
                <div className="section-title">🤝 Shared With Me</div>
                <div className="section-description">Addresses that have granted you access to their vaults</div>
              </div>
              <SharedWithMe contract={contract} account={account} />
            </section>
          )}
        </main>
      </div>

      {/* Share modal — only rendered when open and contract exists */}
      {modalOpen && contract && (
        <Modal setModalOpen={setModalOpen} contract={contract} addToast={addToast} />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
