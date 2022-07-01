require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("./tasks/block-number");
require("hardhat-gas-reporter");
require("solidity-coverage");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xSomething";

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "https://nothing.com";
const POLYGON_MUMBAI_RPC_URL =
  process.env.POLYGON_MUMBAI_RPC_URL || "https://nothing.com";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "Key";
const POLYGONSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "Key";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "Key";

const CMC_API_KEY = process.env.CMC_API_KEY || "Key";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainID: 4,
    },
    polygonMumbai: {
      url: POLYGON_MUMBAI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainID: 80001,
    },
    bsc: {
      url: "https://bsc.nodereal.io",
      accounts: [PRIVATE_KEY],
      chainID: 56,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: [PRIVATE_KEY],
      chainID: 97,
    },
    localhost: {
      url: "HTTP://127.0.0.1:7545",
      accounts: [
        "19f6f8a8a66ee1c3192ac66902575d69f0f6db39370a9f8a90d095cfd48f1c21",
      ],
      chainID: 5777,
    },
  },
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: { enabled: true, runs: 400 },
      evmVersion: "istanbul",
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      rinkeby: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: true,
    outputfile: "gasReport.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: CMC_API_KEY,
    token: "MATIC",
  },
};
