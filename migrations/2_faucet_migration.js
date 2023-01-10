const faucetContract = artifacts.require("Faucet");

module.exports = function (deployer) {
  deployer.deploy(faucetContract);
};
