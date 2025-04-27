async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte :", deployer.address);

  const unlockTime = Math.floor(Date.now() / 1000) + 60;

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime);
  
  await lock.waitForDeployment();

  console.log("Smart contract déployé à l'adresse :", lock.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
