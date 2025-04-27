require("@nomicfoundation/hardhat-ethers");
require('dotenv').config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    base_sepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.METAMASK_PRIVATE_KEY],
      chainId: 84532,
    },
  }
};
