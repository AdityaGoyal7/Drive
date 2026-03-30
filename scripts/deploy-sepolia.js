const hre = require("hardhat");

async function main() {
  console.log("Deploying Upload contract to Sepolia...");
  
  const Upload = await hre.ethers.getContractFactory("Upload");
  const upload = await Upload.deploy();

  await upload.deployed();

  console.log("\n✅ Contract deployed successfully!");
  console.log("Contract Address:", upload.address);
  console.log("\n⚠️  Update this address in client/src/App.js line 90:");
  console.log(`const CONTRACT_ADDRESS = "${upload.address}";`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
