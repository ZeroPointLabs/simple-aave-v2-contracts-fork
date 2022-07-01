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
//Part 1: Deploy basic libraries of the protocol
//After running the script, copy and paste the deployed addresses to deployedAddresses.js
async function main() {
  //@Deploy GenericLogic
  console.log("Deploying @GenericLogic Library...");
  const GenericLogicFactory = await ethers.getContractFactory("GenericLogic");
  const GenericLogic = await GenericLogicFactory.deploy();
  await GenericLogic.deployed();
  console.log("Successfully deployed @GenericLogic at address: ");
  console.log(GenericLogic.address);
  console.log("\n");

  //@Deploy ValidationLogic
  //Require GenericLogic's address as arguement
  console.log("Deploying @ValidationLogic Library...");
  const ValidationLogicFactory = await ethers.getContractFactory(
    "ValidationLogic",
    {
      libraries: {
        GenericLogic: GenericLogic.address,
      },
    }
  );
  const ValidationLogic = await ValidationLogicFactory.deploy();
  await ValidationLogic.deployed();
  console.log("Successfully deployed @ValidationLogic at address: ");
  console.log(ValidationLogic.address);
  console.log("\n");

  //@Deploy ReserveLogic
  console.log("Deploying @ReserveLogic Library...");
  const ReserveLogicFactory = await ethers.getContractFactory("ReserveLogic");
  const ReserveLogic = await ReserveLogicFactory.deploy();
  await ReserveLogic.deployed();
  console.log("Successfully deployed @ReserveLogic at address: ");
  console.log(ReserveLogic.address);
  console.log("\n");

  //@Author
  //If Deployed on supported network, verify contracts through Etherscan API
  console.log("Attempting to verify contracts on Etherscan");
  if (isSupportedNetwork()) {
    await GenericLogic.deployTransaction.wait(6);
    await verify(GenericLogic.address, []);

    await ValidationLogic.deployTransaction.wait(6);
    await verify(ValidationLogic.address, []);

    await ReserveLogic.deployTransaction.wait(6);
    await verify(ReserveLogic.address, []);
  } else {
    console.log("Network does not support Etherscan API auto verify.\n");
  }

  const message = `
  GenericLogic: \"${GenericLogic.address}\",\n
  ValidationLogic: \"${ValidationLogic.address}\",\n
  ReserveLogic: \"${ReserveLogic.address}\",\n
  `;

  console.log(message);

  fs.appendFile("./scripts/deployedAddresses.txt", message, function (err) {
    if (err) throw err;
    console.log("Written Deployed Addresses!");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
