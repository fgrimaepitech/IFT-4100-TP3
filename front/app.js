let currentAccount;
let provider;
let signer;
let nftContract;
let marketplaceContract;

const nftContractAddress = "0x45De5Cf7cD94952de722b80D9fc94FcFBA42a56d";
const nftContractABI = [
  "function mint(string memory tokenURI) public",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "event Minted(address indexed toAddress, uint256 indexed tokenId, string tokenURI)"
];

const marketplaceContractAddress = "0x4Bf8e098d5F19AAF89A9C62337ecCf7B89BD70E6";
const marketplaceContractABI = [
  "function createMarketItem(uint256 tokenId, string memory tokenURI, string memory name, uint256 price) public",
  "function createMarketSale(uint256 tokenId) public payable",
  "function fetchMarketItems() public view returns (tuple(uint256 tokenId, address seller, uint256 price, string tokenURI, string name, bool isSold)[])",
  "function fetchOwnedNFTs(address user) public view returns (uint256[] memory)",
  "function idToMarketItem(uint256) public view returns (tuple(uint256 tokenId, address seller, uint256 price, string tokenURI, string name, bool isSold))"
];


async function connectMetaMask() {
  if (window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    const accounts = await provider.listAccounts();
    currentAccount = accounts[0];

    nftContract = new ethers.Contract(nftContractAddress, nftContractABI, signer);
    marketplaceContract = new ethers.Contract(marketplaceContractAddress, marketplaceContractABI, signer);
    marketplaceReadContract = new ethers.Contract(marketplaceContractAddress, marketplaceContractABI, provider);

    await loadMarketplaceNFTs();
    await loadOwnedNFTs();
  } else {
    alert("MetaMask non détecté");
  }
}


async function mintNFT(nftName) {
  try {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask non détecté');
      return;
    }

    console.log("nft name:", nftName);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(nftContractAddress, nftContractABI, signer);

    if (!contract.mint) {
      console.error('La fonction mint() n\'existe pas.');
      return;
    }

    const tokenURI = "https://ipfs.io/ipfs/QmQEVVLJUR1WLN15S49rzDJsSP7za9DxeqpUzWuG4aondg";

    const tx = await contract.mint(tokenURI);
    console.log('Transaction envoyée:', tx.hash);

    const receipt = await tx.wait();
    console.log('NFT créé avec succès !');

    const iface = new ethers.Interface([
      "event Minted(address indexed toAddress, uint256 indexed tokenId, string tokenURI)"
    ]);

    for (const log of receipt.logs) {
      try {
        const parsedLog = iface.parseLog(log);
        
        if (parsedLog.name === "Minted") {
          const toAddress = parsedLog.args.toAddress;
          const tokenId = parsedLog.args.tokenId;
          const tokenURI = parsedLog.args.tokenURI;
          console.log("Event Minted capturé !");
          console.log("toAddress:", toAddress);
          console.log("tokenId:", tokenId.toString());
          console.log("tokenURI:", tokenURI);

          const price = ethers.parseUnits('0.001', 'ether');
          console.log("Prix de vente:", price.toString());
          const saleTx = await marketplaceContract.createMarketItem(tokenId, tokenURI, nftName, price);
          await saleTx.wait();
          console.log('NFT listé sur le marché avec succès !');
        }
      } catch (e) {
      }
    }

  } catch (error) {
    console.error('Erreur lors de la création du NFT et de la mise en vente sur le marketplace :', error);
  }
}

async function checkApproval(tokenId) {
  try {
      const approvedAddress = await nftContract.getApproved(tokenId);
      return approvedAddress;
  } catch (error) {
      console.error("Erreur lors de la vérification de l'approbation :", error);
  }
}

async function approveNFT(tokenId) {
  try {
      console.log(`Approbation du NFT avec tokenId ${tokenId} pour le contrat marketplace...`);
      const tx = await nftContract.approve(marketplaceContractAddress, tokenId);
      await tx.wait();
      console.log("NFT approuvé avec succès !");
  } catch (error) {
      console.error("Erreur lors de l'approbation :", error);
  }
}

async function buyNFT(tokenId, price) {
  try {
    console.log("price", price);
    const approvedAddress = await checkApproval(tokenId)
    if (approvedAddress !== marketplaceContractAddress) {
        await approveNFT(tokenId);
    }
    const tx = await marketplaceContract.createMarketSale(tokenId, { value: price });
    const receipt = await tx.wait();
    console.log('NFT acheté avec succès !');
    console.log('Receipt:', receipt);
    loadMarketplaceNFTs();
  } catch (error) {
    console.error('Erreur lors de l\'achat du NFT :', error);
    if (error.receipt) {
      console.log('Transaction receipt:', error.receipt);
    }
    if (error.error) {
      console.log('Erreur du contrat:', error.error);
    }
  }
}



async function loadMarketplaceNFTs() {
  if (!marketplaceReadContract) return;

  try {
    const items = await marketplaceReadContract.fetchMarketItems();
    const nftList = document.getElementById('nft-list');
    nftList.innerHTML = '';

    const validItems = items.filter(item => item.seller !== '0x0000000000000000000000000000000000000000');


    if (validItems.length === 0) {
      nftList.innerHTML = "<p>Aucun NFT en vente actuellement.</p>";
    }

    console.log("NFTs en vente :", items);

    validItems.forEach(item => {
      const nftElement = document.createElement('div');
      nftElement.classList.add('nft-card');
    
      nftElement.innerHTML = `
        <div class="nft-image-container">
          <img src="${item.tokenURI}" alt="NFT Image" class="nft-image" />
        </div>
        <div class="nft-details">
          <h2>${item.name}</h2>
          <p><strong>Token ID:</strong> ${item.tokenId}</p>
          <p><strong>Prix:</strong> ${ethers.formatEther(item.price)} ETH</p>
          <p><strong>Vendu:</strong> ${item.isSold ? "Oui" : "Non"}</p>
          <button class="buy-button" data-token-id="${item.tokenId}" data-price="${item.price}">
            Acheter
          </button>
        </div>
      `;
    
      nftList.appendChild(nftElement);
    });
    
    document.querySelectorAll('.buy-button').forEach(button => {
      button.addEventListener('click', async (e) => {
        const tokenId = e.target.getAttribute('data-token-id');
        const price = e.target.getAttribute('data-price');
        await buyNFT(tokenId, BigInt(price));
      });
    });
    
  } catch (error) {
    console.error("Erreur lors du chargement des NFTs en vente :", error);
  }
}

async function loadOwnedNFTs() {
  if (!marketplaceReadContract) return;

  try {
    const ownedTokenIds = await marketplaceReadContract.fetchOwnedNFTs(currentAccount);

    const ownedList = document.getElementById('owned-nft-list');
    ownedList.innerHTML = '';

    if (ownedTokenIds.length === 0) {
      ownedList.innerHTML = "<p>Vous ne possédez aucun NFT pour le moment.</p>";
      return;
    }

    for (const tokenId of ownedTokenIds) {
      const marketItem = await marketplaceReadContract.idToMarketItem(tokenId);

      const nftElement = document.createElement('div');
      nftElement.classList.add('nft-card');

      nftElement.innerHTML = `
        <div class="nft-image-container">
          <img src="${marketItem.tokenURI}" alt="NFT Image" class="nft-image" />
        </div>
        <div class="nft-details">
          <h2>${marketItem.name}</h2>
          <p><strong>Token ID:</strong> ${marketItem.tokenId}</p>
          <p><strong>Prix d'achat initial:</strong> ${ethers.formatEther(marketItem.price)} ETH</p>
          <p><strong>Statut:</strong> ${marketItem.isSold ? "Acheté" : "Disponible"}</p>
        </div>
      `;

      ownedList.appendChild(nftElement);
    }
  } catch (error) {
    console.error("Erreur lors du chargement de vos NFTs :", error);
  }
}


document.getElementById('mint-button').addEventListener('click', async () => {
  const nftName = document.getElementById('nftName').value;
  if (nftName.length === 0) {
    alert("Veuillez entrer un nom pour le NFT.");
    return;
  }
  mintNFT(nftName);
});
document.addEventListener('DOMContentLoaded', connectMetaMask);
