# ⚡ VaultHub — Web3 Secure Storage

> **Decentralized file vault** — Secured by Ethereum, pinned to IPFS, zero intermediaries.

**VaultHub** is a premium Web3 application that lets you upload files to IPFS via Pinata and record ownership immutably on the Ethereum blockchain. Grant granular access to other wallet addresses, view shared vaults, and manage your files with complete control—all on-chain, all transparent.

---

## 🎯 What is VaultHub?

VaultHub combines the permanence of **IPFS storage** with the transparency of **blockchain verification**. Your files are yours alone—nobody else can access or modify them unless you explicitly grant permission.

### Core Benefits
- 🔐 **Complete Control** — You own your data, nobody else
- 🔗 **Blockchain Verified** — Every action recorded on Ethereum
- 📌 **Permanent Storage** — Files pinned to IPFS forever
- 🎯 **Granular Sharing** — Share access per wallet address
- 💨 **Zero Intermediaries** — Decentralized, no servers, no backdoors

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MetaMask or Web3-capable wallet
- Ethereum on Sepolia testnet (or local Hardhat network)

### 1. Install dependencies

```bash
# Root (Hardhat + smart contracts)
npm install

# Frontend (React + Web3)
cd client && npm install
```

### 2. Configure environment

Create `client/.env`:

```env
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key
REACT_APP_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 3. Deploy Smart Contract

**For Sepolia Testnet:**
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
# Copy the printed contract address into your .env
```

**For local Hardhat node:**
```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Start the frontend

```bash
cd client && npm start
```

The app will open at `http://localhost:3000`

---

## 🏗 Architecture

| Component | Technology |
|-----------|-----------|
| **Blockchain** | Ethereum (Sepolia / Hardhat) |
| **Smart Contract** | Solidity 0.8.9 |
| **Storage** | IPFS via Pinata |
| **Frontend** | React 18 + ethers.js v5 |
| **Deployment** | Vercel (auto-deploy on push) |
| **Styling** | CSS3 (Indigo/Black theme) |

---

## ✨ Features

### 📤 File Upload
- Drag & drop or click to upload
- Files automatically pinned to IPFS
- Upload recorded on-chain with one transaction
- Real-time transaction notifications

### 🗄 Vault Management
- View all your uploaded files
- Soft-delete files (marking as deleted in contract)
- Copy permanent IPFS links
- Manage file metadata on-chain

### 🤝 Access Control
- **Share Access** — Grant wallet addresses permission to view your vault
- **Revoke Access** — Remove permission anytime
- **Shared With** section — See which addresses have access to your files
- **Cross-Vault Viewing** — View any vault you have permission for

### 🔔 Real-Time Feedback
- Transaction notifications (success/error/pending)
- Toast alerts for all actions
- Live blockchain verification status
- Auto-refresh of vault contents

---

## 📁 Project Structure

```
VaultHub/
├── contracts/
│   └── Upload.sol                # Smart contract (ABI + logic)
├── scripts/
│   ├── deploy.js                 # Local deployment
│   └── deploy-sepolia.js         # Sepolia testnet deployment
├── hardhat.config.js
└── client/
    ├── public/                   # Static assets
    ├── src/
    │   ├── App.js                # Main application shell
    │   ├── App.css               # Theme & global styles (Indigo/Black)
    │   ├── index.css             # CSS variables
    │   └── components/
    │       ├── FileUpload.js      # Upload zone component
    │       ├── FileUpload.css
    │       ├── Display.js         # Vault contents viewer
    │       ├── Display.css
    │       ├── Modal.js           # Share access modal
    │       ├── Modal.css
    │       ├── TransactionPanel.js   # Real-time notifications
    │       ├── TransactionPanel.css
    │       ├── SharedWithMe.js     # Shared addresses viewer
    │       ├── SharedWithMe.css
    │       └── artifacts/         # Contract ABIs (auto-generated)
    └── package.json
```

---

## 🔗 Smart Contract

### Key Functions

**Upload a file:**
```solidity
add(address _user, string url)
```

**Delete a file:**
```solidity
remove(uint256 index)  // Marks file as deleted (soft-delete)
```

**View your vault:**
```solidity
display(address _user) -> string[] // Returns active files only
```

**Grant access:**
```solidity
allow(address user)
```

**Revoke access:**
```solidity
disallow(address user)
```

**See who has access:**
```solidity
shareAccess() -> Access[]  // Returns access list
```

### Data Structure

```solidity
struct UploadedFile {
  string url;      // IPFS hash
  bool deleted;    // Soft deletion flag
}

struct Access {
  address user;    // Wallet address
  bool access;     // Permission status
}
```

---

## 🎨 UI/UX Features

### Premium Design
- **Color Scheme:** Pure black backgrounds (#0a0a0a), Indigo primary (#6366f1), Purple accents (#a78bfa)
- **Animations:** Smooth transitions, glowing effects, slide-in notifications
- **Responsive:** Works on desktop, tablet, mobile
- **Glass Morphism:** Frosted glass effect on cards and modals
- **Dark Mode:** Built-in, optimized for web3 interfaces

### Components Included
- Top navigation bar with wallet connection
- Upload zone with drag-and-drop support
- Vault contents grid with file management
- Share access modal with Ethereum address input
- Transaction notification panel
- Shared vaults viewer
- Footer with project info

---

## 🌐 Deployment

### Vercel (Production)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel settings:
   - `REACT_APP_PINATA_API_KEY`
   - `REACT_APP_PINATA_SECRET_KEY`
   - `REACT_APP_CONTRACT_ADDRESS`
3. Push to `master` branch → auto-deploys
4. Access your live app via Vercel URL

### Manual Build

```bash
cd client
npm run build
# Build output in client/build/
```

---

## 🛠 Development

### Environment Variables

**For development (`client/.env`):**
```env
REACT_APP_PINATA_API_KEY=pk_test_xxxxx
REACT_APP_PINATA_SECRET_KEY=sk_test_xxxxx
REACT_APP_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### Local Testing

```bash
# Terminal 1: Hardhat local blockchain
npx hardhat node

# Terminal 2: Deploy contract locally
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: React dev server
cd client && npm start
```

### Connect MetaMask to Local Network
1. Open MetaMask
2. Settings → Networks → Add Network
3. Network Name: `Hardhat`
4. RPC URL: `http://127.0.0.1:8545`
5. Chain ID: `31337`
6. Currency: `ETH`

---

## 📊 Contract Deployment Addresses

**Sepolia Testnet:**
- See your latest deployment output or check Vercel environment variables

**Local Hardhat:**
- Printed in terminal after running `deploy.js`

---

## 🔒 Security Notes

- **Private keys:** Never commit `.env` files with real keys
- **File hashes:** IPFS links are permanent—verify before sharing
- **Wallet security:** Only grant access to trusted addresses
- **Gas costs:** Test on testnet before mainnet deployment

---

## 📝 License

MIT License — Feel free to fork, modify, and build!

---

## 🤝 Contributing

Found a bug? Have a feature idea? Open an issue or submit a PR!

**VaultHub** — Your files. Your rules. Forever. 🔐
