const fs = require("fs");
const chalk = require("chalk");
const { ethers, tenderly } = require("hardhat");
const { utils } = require("ethers");

const deploy = async (
  contractName,
  _args = [],
  overrides = {},
  libraries = {}
) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName, {
    libraries: libraries
  });
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  let extraGasInfo = "";
  if (deployed && deployed.deployTransaction) {
    const gasUsed = deployed.deployTransaction.gasLimit.mul(
      deployed.deployTransaction.gasPrice
    );
    extraGasInfo = `${utils.formatEther(gasUsed)} ETH, tx hash ${
      deployed.deployTransaction.hash
    }`;
  }

  console.log(
    " 📄",
    chalk.cyan(contractName),
    "deployed to:",
    chalk.magenta(deployed.address)
  );
  console.log(" ⛽", chalk.grey(extraGasInfo));

  await tenderly.persistArtifacts({
    name: contractName,
    address: deployed.address
  });

  return deployed;
};

const main = async () => {
  console.log("\n\n 📡 Deploying...\n");

  const ConvertLib = await deploy("ConvertLib");
  const MetaCoin = await deploy(
    "MetaCoin",
    [],
    {},
    { ConvertLib: ConvertLib.address }
  );
  const _WrappedMetaCoin = await deploy("WrappedMetaCoin", [MetaCoin.address]);

  console.log(
    " 💾  Artifacts (address, abi, and args) saved to: ",
    chalk.blue("packages/hardhat/artifacts/"),
    "\n\n"
  );
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
