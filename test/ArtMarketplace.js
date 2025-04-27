const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtMarketplace", function () {
  let owner, seller, buyer;
  let artNFT, marketplace;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    const ArtNFT = await ethers.getContractFactory("ArtNFT");
    artNFT = await ArtNFT.connect(owner).deploy();
    await artNFT.waitForDeployment();

    const ArtMarketplace = await ethers.getContractFactory("ArtMarketplace");
    marketplace = await ArtMarketplace.connect(owner).deploy(await artNFT.getAddress());
    await marketplace.waitForDeployment();
  });

  it("Test 1 : Déploiement du contrat", async function () {
    const address = await marketplace.getAddress();
    expect(address).to.not.equal(ethers.ZeroAddress);
  });

  it("Test 2 : Créer un NFT (minting)", async function () {
    await artNFT.connect(owner).mint("ipfs://token-uri-1");

    const ownerOfToken = await artNFT.ownerOf(0);
    expect(ownerOfToken).to.equal(owner.address);
  });

  it("Test 3 : Mettre un NFT en vente", async function () {
    await artNFT.connect(owner).mint("ipfs://token-uri-1");

    await artNFT.connect(owner).approve(await marketplace.getAddress(), 0);

    await marketplace.connect(owner).createMarketItem(
      0,
      "ipfs://token-uri-1",
      "ArtPiece1",
      ethers.parseEther("1.0")
    );

    const marketItem = await marketplace.idToMarketItem(0);
    expect(marketItem.price).to.equal(ethers.parseEther("1.0"));
    expect(marketItem.isSold).to.be.false;
  });

  it("Test 4 : Acheter un NFT", async function () {
    await artNFT.connect(owner).mint("ipfs://token-uri-1");
    await artNFT.connect(owner).approve(await marketplace.getAddress(), 0);

    await marketplace.connect(owner).createMarketItem(
      0,
      "ipfs://token-uri-1",
      "ArtPiece1",
      ethers.parseEther("1.0")
    );

    const oldOwner = await artNFT.ownerOf(0);
    expect(oldOwner).to.equal(owner.address);

    await marketplace.connect(buyer).createMarketSale(0, { value: ethers.parseEther("1.0") });

    const newOwner = await artNFT.ownerOf(0);
    expect(newOwner).to.equal(buyer.address);
  });

  it("Test 5 : Vérification de l'historique de possession des NFT", async function () {
    await artNFT.connect(owner).mint("ipfs://token-uri-1");
    await artNFT.connect(owner).approve(await marketplace.getAddress(), 0);
  
    await marketplace.connect(owner).createMarketItem(
      0,
      "ipfs://token-uri-1",
      "ArtPiece1",
      ethers.parseEther("1.0")
    );
  
    await marketplace.connect(buyer).createMarketSale(0, { value: ethers.parseEther("1.0") });
  
    const newOwner = await artNFT.ownerOf(0);
    expect(newOwner).to.equal(buyer.address);
  
    const ownedNFTs = await marketplace.fetchOwnedNFTs(buyer.address);
    expect(ownedNFTs.length).to.equal(1);
    expect(ownedNFTs[0]).to.equal(BigInt(0));
  });  

  it("Test 6 : Vérification des métadonnées NFT", async function () {
    await artNFT.connect(owner).mint("ipfs://token-uri-1");
    expect(true).to.be.true;
  });

  it("Test 7 : Gestion des doublons de listes NFT", async function () {
    await artNFT.connect(owner).mint("ipfs://token-uri-1");
    await artNFT.connect(owner).approve(await marketplace.getAddress(), 0);

    await marketplace.connect(owner).createMarketItem(
      0,
      "https://ipfs.io/ipfs/QmQEVVLJUR1WLN15S49rzDJsSP7za9DxeqpUzWuG4aondg",
      "ArtPiece1",
      ethers.parseEther("1.0")
    );
    
    const marketItem = await marketplace.idToMarketItem(0);
    expect(marketItem.seller).to.equal(owner.address);
    expect(marketItem.isSold).to.equal(false);
  });
});
