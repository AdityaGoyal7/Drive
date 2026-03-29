# ⬡ ChainVault 3.0

> **Decentralized file storage** — secured by Ethereum, pinned to IPFS, beautifully presented.

ChainVault lets you upload files to IPFS via Pinata and record ownership immutably on-chain. You can grant or revoke access to specific wallet addresses, and view any vault you have permission for.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
# Root (Hardhat + contracts)
npm install

# Frontend (React)
cd client && npm install
```

### 2. Configure environment

Create `client/.env`:

```env
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key
REACT_APP_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 3. Run local blockchain

```bash
npx hardhat node
```

### 4. Deploy contract

```bash
npx hardhat run scripts/deploy.js --network localhost
# Copy the printed address into your .env
```

### 5. Start the app

```bash
cd client && npm start
```

---

## 🏗 Architecture

| Layer | Technology |
|-------|-----------|
| Blockchain | Ethereum (Hardhat local / any EVM) |
| Storage | IPFS via Pinata |
| Smart Contract | Solidity 0.8.9 |
| Frontend | React 18 |
| Web3 | ethers.js v5 |

## ✨ Features

- **Upload any file** — pinned permanently to IPFS
- **On-chain ownership** — every upload recorded on the blockchain
- **Granular access control** — grant/revoke per wallet address
- **Browse any vault** — view files from any address you have permission for
- **Copy IPFS links** — shareable, permanent URLs
- **Toast notifications** — real-time feedback on every action

## 📁 Project Structure

```
ChainVault/
├── contracts/
│   └── Upload.sol          # Core smart contract
├── scripts/
│   └── deploy.js           # Deployment script
├── hardhat.config.js
└── client/
    └── src/
        ├── App.js           # Main app shell
        ├── components/
        │   ├── FileUpload.js  # Upload zone
        │   ├── Display.js     # Vault viewer
        │   └── Modal.js       # Share access modal
        └── artifacts/        # Auto-generated ABI (after deploy)
```
