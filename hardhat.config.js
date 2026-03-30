require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    ...(process.env.ALCHEMY_URL && process.env.PRIVATE_KEY && {
      sepolia: {
        url: process.env.ALCHEMY_URL,
        accounts: [process.env.PRIVATE_KEY],
      },
    }),
  },
  paths: {
    artifacts: "./client/src/artifacts",
  },
};