//@Author
//Development environment & utilities
const hre = require("hardhat");
const { getContractAddress } = require("ethers/lib/utils");
const { ethers, run, network } = require("hardhat");
const {
  Contract,
} = require("hardhat/internal/hardhat-network/stack-traces/model.js");
const fs = require("fs");

const provider = ethers.provider;
const signer = ethers.provider.getSigner();

//@Author
//Information of deployed contracts
const deployedAddresses = require("./deployedContractsInformation/deployedAddresses.js");
const deployedAbi = require("./deployedContractsInformation/deployedAbi.js");

//@Author
//Asset Information
//Use this to tweak with supported assets and oracle
const assets = [
  "0x3BfAA8A31dC3b2Ef40216728Af248994b27822b8",
  "0xb44AC2d598d4F23aF7710A609c565798668e8883",
];

const priceFeed = [
  "0xa24de01df22b63d23Ebc1882a5E3d4ec0d907bFB",
  "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
];

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

const LendingPoolAddressesProvider = new ethers.Contract(
  deployedAddresses.LendingPoolAddressesProvider,
  deployedAbi.LendingPoolAddressesProvider,
  signer
);

async function main() {
  //@Deploy AaveOracle
  //Explanation: Act as a aggregator for PriceFeed
  console.log("Deploying @AaveOracle Contract...");
  const AaveOracleFactory = await ethers.getContractFactory("AaveOracle");
  const AaveOracle = await AaveOracleFactory.deploy(assets, priceFeed);
  await AaveOracle.deployed();
  console.log("Successfully deployed @AaveOracle at address: ");
  console.log(AaveOracle.address);
  console.log("\n");

  //@Deploy LendingRateOracle
  //Explanation: Use to get and set borrow rates
  console.log("Deploying @LendingRateOracle Contract...");
  const LendingRateOracleFactory = await ethers.getContractFactory(
    "LendingRateOracle"
  );
  const LendingRateOracle = await LendingRateOracleFactory.deploy();
  await LendingRateOracle.deployed();
  console.log("Successfully deployed @LendingRateOracle at address: ");
  console.log(LendingRateOracle.address);
  console.log("\n");

  //@Deploy StableAndVariableTokensHelper
  //Explanation: Used to interact with LendingRateOracle in batch
  console.log("Deploying @StableAndVariableTokensHelper Library...");
  const StableAndVariableTokensHelperFactory = await ethers.getContractFactory(
    "StableAndVariableTokensHelper"
  );
  const StableAndVariableTokensHelper =
    await StableAndVariableTokensHelperFactory.deploy(
      signer.getAddress(),
      LendingPoolAddressesProvider.address
    );
  await StableAndVariableTokensHelper.deployed();
  console.log(
    "Successfully deployed @StableAndVariableTokensHelper at address: "
  );
  console.log(StableAndVariableTokensHelper.address);
  console.log("\n");

  //@Calling @setPriceOracle() - LendingPoolAddressesProvider
  console.log("@Calling @setPriceOracle() - - LendingPoolAddressesProvider");
  await LendingPoolAddressesProvider.setPriceOracle(AaveOracle.address);

  if (
    (await LendingPoolAddressesProvider.getAddress(
      ethers.utils.formatBytes32String("PRICE_ORACLE")
    )) == AaveOracle.address
  ) {
    console.log(
      "Successfully register AaveOracle ${AaveOracle.address} on LendingPoolAddressesProvider\n"
    );
  } else {
    console.log("ERROR: Not able to register AaveOracle!!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
