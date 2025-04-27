async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte :", deployer.address);

  const nonce = await ethers.provider.getTransactionCount(deployer.address);

  const ArtNFT = await ethers.getContractFactory("ArtNFT");
  const artNFT = await ArtNFT.deploy({
    nonce: nonce,
  });
  console.log("NFT Contract déployé à l'adresse :", artNFT.target);

  const ArtMarketplace = await ethers.getContractFactory("ArtMarketplace");
  const marketplace = await ArtMarketplace.deploy(artNFT.target);
  console.log("Marketplace Contract déployé à l'adresse :", marketplace.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
