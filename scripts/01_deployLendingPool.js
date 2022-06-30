//@Author
//Development environment & utilities
const hre = require("hardhat");
const { getContractAddress } = require("ethers/lib/utils");
const { ethers, run, network } = require("hardhat");
const {
  Contract,
} = require("hardhat/internal/hardhat-network/stack-traces/model.js");
const fs = require("fs");

//@Author
//Information of deployed contracts
const deployedAddresses = require("./deployedContractsInformation/deployedAddresses.js");
const deployedAbi = require("./deployedContractsInformation/deployedAbi.js");

function isSupportedNetwork() {
  if (
    (network.config.chainID === 4 && process.env.ETHERSCAN_API_KEY) ||
    (network.config.chainID === 80001 && process.env.POLYGONSCAN_API_KEY) ||
    (network.config.chainID === 56 && process.env.BSCSCAN_API_KEY)
  )
    return true;
  else return false;
}

async function verify(contractAddress, args) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

//@Author
//Part 2: Deploy LendingPool and related contracts
async function main() {
  //@Deploy LendingPool
  console.log("Deploying LendingPool Library...");
  const LendingPoolFactory = await ethers.getContractFactory("LendingPool", {
    libraries: {
      ReserveLogic: ReserveLogic.address,
      ValidationLogic: ValidationLogic.address,
    },
  });
  const GenerLendingPoolicLogic = await LendingPoolFactory.deploy();
  await LendingPool.deployed();
  console.log("Successfully deployed LendingPool at address: ");
  console.log(LendingPool.address);
  console.log("\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
