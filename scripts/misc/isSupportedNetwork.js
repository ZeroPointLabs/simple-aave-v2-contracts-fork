export function isSupportedNetwork() {
  if (
    (network.config.chainID === 4 && process.env.ETHERSCAN_API_KEY) ||
    (network.config.chainID === 80001 && process.env.POLYGONSCAN_API_KEY) ||
    (network.config.chainID === 56 && process.env.BSCSCAN_API_KEY)
  )
    return true;
  else return false;
}

module.export = isSupportedNetwork;
