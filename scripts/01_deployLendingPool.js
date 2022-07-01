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
  //Arguments: Require ReserveLogic and ValidationLogic as library
  //Explanation: Used by users to interact with the entire protocol
  //Proxy: Covered by proxy contract
  console.log("Deploying @LendingPool Contract...");
  const LendingPoolFactory = await ethers.getContractFactory("LendingPool", {
    libraries: {
      ReserveLogic: deployedAddresses.ReserveLogic,
      ValidationLogic: deployedAddresses.ValidationLogic,
    },
  });
  const LendingPool = await LendingPoolFactory.deploy();
  await LendingPool.deployed();
  console.log("Successfully deployed @LendingPool at address: ");
  console.log(LendingPool.address);
  console.log("\n");

  //@Deploy LendingPoolCollateralManager
  //Explanation: Implementation of liquidationCall
  //Interact via DELEGATECALL from LendingPool
  console.log("Deploying @LendingPoolCollateralManager Contract...");
  const LendingPoolCollateralManagerFactory = await ethers.getContractFactory(
    "LendingPoolCollateralManager"
  );
  const LendingPoolCollateralManager =
    await LendingPoolCollateralManagerFactory.deploy();
  await LendingPoolCollateralManager.deployed();
  console.log(
    "Successfully deployed @LendingPoolCollateralManager at address: "
  );
  console.log(LendingPoolCollateralManager.address);
  console.log("\n");

  //@Deploy LendingPoolAddressesProviderRegistry
  //Explanation: Contract to register different LendingPoolAddressesProvider
  //To keep track of different market of AAVE V2 Protocol
  console.log("Deploying @LendingPoolAddressesProviderRegistry Contract...");
  const LendingPoolAddressesProviderRegistryFactory =
    await ethers.getContractFactory("LendingPoolAddressesProviderRegistry");
  const LendingPoolAddressesProviderRegistry =
    await LendingPoolAddressesProviderRegistryFactory.deploy();
  await LendingPoolAddressesProviderRegistry.deployed();
  console.log(
    "Successfully deployed @LendingPoolAddressesProviderRegistry at address: "
  );
  console.log(LendingPoolAddressesProviderRegistry.address);
  console.log("\n");

  //@Deploy LendingPoolAddressesProvider
  //Explanation: Registry of addresses part of or connected to the protocol
  //Factory of proxies and admin of those, so with right to change its implementations
  //IMPORTANT - This contract is the admin of all InitializableImmutableAdminUpgradeabilityProxy
  //as described in _updateImpl
  console.log("Deploying @LendingPoolAddressesProvider Contract...");
  const LendingPoolAddressesProviderFactory = await ethers.getContractFactory(
    "LendingPoolAddressesProvider"
  );
  const LendingPoolAddressesProvider =
    await LendingPoolAddressesProviderFactory.deploy("TestLendProtocol");
  await LendingPoolAddressesProvider.deployed();
  console.log(
    "Successfully deployed @LendingPoolAddressesProvider at address: "
  );
  console.log(LendingPoolAddressesProvider.address);
  console.log("\n");

  //@Deploy LendingPoolConfigurator
  //Explanation: used by protocol owner to call admin functions
  //Handle Admin functions: initialize reserve, update AToken etc.
  //Interaction: ChefIncentivesController, MultiFeeDistribution, LendingPool, LendingPoolAddressesProvider
  //Proxy: Covered by proxy contract
  console.log("Deploying @LendingPoolConfigurator Contract...");
  const LendingPoolConfiguratorFactory = await ethers.getContractFactory(
    "LendingPoolConfigurator"
  );
  const LendingPoolConfigurator = await LendingPoolConfiguratorFactory.deploy();
  await LendingPoolConfigurator.deployed();
  console.log("Successfully deployed @LendingPoolConfigurator at address: ");
  console.log(LendingPoolConfigurator.address);
  console.log("\n");

  //@Calling @registerAddressesProvider() - LendingPoolAddressesProviderRegistry
  console.log(
    "Calling @registerAddressesProvider() - LendingPoolAddressesProviderRegistry"
  );
  await LendingPoolAddressesProviderRegistry.registerAddressesProvider(
    LendingPoolAddressesProvider.address,
    1
  );

  //@Checks Calling @getAddressesProvidersList() - LendingPoolAddressesProviderRegistry
  //Checks whether the retistered AddressesProvider address matches
  let registeredLendingPoolAddressesProviderArray =
    await LendingPoolAddressesProviderRegistry.getAddressesProvidersList();
  if (
    registeredLendingPoolAddressesProviderArray[0] ==
    LendingPoolAddressesProvider.address
  ) {
    let id =
      await LendingPoolAddressesProviderRegistry.getAddressesProviderIdByAddress(
        LendingPoolAddressesProvider.address
      );
    console.log(
      `Successfully register AddressesProvider ${LendingPoolAddressesProvider.address} as Market ID - ${id}\n`
    );
  } else console.log(`Failed to register AddressesProvider`);

  //@Calling @setPoolAdmin() - LendingPoolAddressesProvider
  console.log("Calling @setPoolAdmin() - LendingPoolAddressesProvider");
  await LendingPoolAddressesProvider.setPoolAdmin(await signer.getAddress());

  //@Check Calling @getPoolAdmin() - LendingPoolAddressesProvider
  //Check whether PoolAdmin has been set correctly
  if (
    (await LendingPoolAddressesProvider.getPoolAdmin()) ==
    (await signer.getAddress())
  ) {
    console.log(
      `Successfully set ${await signer.getAddress()} as PoolAdmin of LendingPoolAddressesProvider\n`
    );
  } else {
    console.log(`ERROR Setting PoolAdmin`);
  }

  //@Calling @setEmergencyAdmin() - LendingPoolAddressesProvider
  console.log("@Calling @setEmergencyAdmin() - LendingPoolAddressesProvider");
  await LendingPoolAddressesProvider.setEmergencyAdmin(
    await signer.getAddress()
  );

  //@Check Calling @getEmergencyAdmin() - LendingPoolAddressesProvider
  //Check whether EmergencyAdmin has been set correctly
  if (
    (await LendingPoolAddressesProvider.getEmergencyAdmin()) ==
    (await signer.getAddress())
  ) {
    console.log(
      `Successfully set ${await signer.getAddress()} as EmergencyAdmin of LendingPoolAddressesProvider\n`
    );
  } else {
    console.log(`ERROR Setting EmergencyAdmin\n`);
  }

  //@Author
  /*
  //@Calling @initialize() - LendingPool
  console.log("@Calling @initialize() - LendingPool");
  await LendingPool.initialize(LendingPoolAddressesProvider.address);

  console.log(
    `Successfully initialized LendingPool with ${LendingPoolAddressesProvider.address} as AddressesProvider\n`
  );
  */

  //@Calling @setLendingPoolImpl() - LendingPoolAddressesProvider
  //This function will emit a new proxy contract
  //@Listen to @ProxyCreated event
  // let proxyLendingPool;LendingPoolAddressesProvider.once("ProxyCreated",async function (id, proxyAddress) {if (ethers.utils.parseBytes32String(id) == "LENDING_POOL") {proxyLendingPool = proxyAddress;console.log(`Created ProxyLendingPool at ${proxyAddress}\n`);}});

  console.log("@Calling @setLendingPoolImpl() - LendingPoolAddressesProvider");
  await LendingPoolAddressesProvider.setLendingPoolImpl(LendingPool.address);

  console.log(
    `Successfully register LendingPool ${LendingPool.address} on LendingPoolAddressesProvider as implementation\n`
  );
  const ProxyLendingPoolAddress = await LendingPoolAddressesProvider.getAddress(
    ethers.utils.formatBytes32String("LENDING_POOL")
  );
  console.log(`ProxyLendingPool deployed at ${ProxyLendingPoolAddress}\n`);

  //@Calling @setLendingPoolConfiguratorImpl() - LendingPoolAddressesProvider
  //This function will emit a new proxy contract
  //@Listen to @ProxyCreated event
  // let proxyLendingPoolConfigurator;LendingPoolAddressesProvider.once("ProxyCreated",async function (id, proxyAddress) {if (ethers.utils.parseBytes32String(id) == "LENDING_POOL_CONFIGURATOR") {proxyLendingPoolConfigurator = proxyAddress;console.log(`Created ProxyLendingPoolConfigurator at ${proxyLendingPoolConfigurator}\n`);}});

  console.log(
    "@Calling @setLendingPoolConfiguratorImpl() - LendingPoolAddressesProvider"
  );
  await LendingPoolAddressesProvider.setLendingPoolConfiguratorImpl(
    LendingPoolConfigurator.address
  );

  console.log(
    `Successfully register LendingPoolConfigurator ${LendingPoolConfigurator.address} on LendingPoolAddressesProvider as implementation\n`
  );
  const ProxyLendingPoolConfiguratorAddress =
    await LendingPoolAddressesProvider.getAddress(
      ethers.utils.formatBytes32String("LENDING_POOL_CONFIGURATOR")
    );
  console.log(
    `ProxyLendingPoolConfigurator deployed at ${ProxyLendingPoolConfiguratorAddress}\n`
  );

  //@Author
  //If Deployed on supported network, verify contracts through Etherscan API
  console.log("Attempting to verify contracts on Etherscan");
  if (isSupportedNetwork()) {
    await LendingPool.deployTransaction.wait(6);
    await verify(LendingPool.address, []);

    await LendingPoolCollateralManager.deployTransaction.wait(6);
    await verify(LendingPoolCollateralManager.address, []);

    await LendingPoolAddressesProviderRegistry.deployTransaction.wait(6);
    await verify(LendingPoolAddressesProviderRegistry.address, []);

    await LendingPoolAddressesProvider.deployTransaction.wait(6);
    await verify(LendingPoolAddressesProvider.address, ["TestLendProtocol"]);

    await LendingPoolConfigurator.deployTransaction.wait(6);
    await verify(LendingPoolConfigurator.address, []);
  } else {
    console.log("Network does not support Etherscan API auto verify.\n");
  }

  const message = `
  ProxyLendingPool: \"${ProxyLendingPoolAddress}\",\n
  LendingPool: \"${LendingPool.address}\",\n
  LendingPoolColleteralManager: \"${LendingPoolCollateralManager.address}\",\n
  LendingPoolAddressesProviderRegistry: \"${LendingPoolAddressesProviderRegistry.address}\",\n
  LendingPoolAddressesProvider: \"${LendingPoolAddressesProvider.address}\",\n
  ProxyLendingPoolConfigurator: \"${ProxyLendingPoolConfiguratorAddress}\",\n
  LendingPoolConfigurator: \"${LendingPoolConfigurator.address}\",\n
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
