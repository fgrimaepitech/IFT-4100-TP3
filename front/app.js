let currentAccount;
let provider;
let signer;
let nftContract;
let marketplaceContract;

const nftContractAddress = "0x75Fc847D1617e8A33f57431Cfcc5512eb7d356f8";
const nftContractABI = [
  "function mint(string memory tokenURI) public",
  "event Minted(address indexed toAddress, uint256 indexed tokenId, string tokenURI)"
];

const marketplaceContractAddress = "0x4264ac0B9192C8d0C8DE54237D31C25fc7f0E26F";
const marketplaceContractABI = [
  "function createMarketItem(uint256 tokenId, uint256 price) public",
  "function createMarketSale(uint256 tokenId) public payable",
  "function fetchMarketItems() public view returns (tuple(uint256 tokenId, address seller, uint256 price, bool isSold)[])"
];

async function connectMetaMask() {
  if (window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();  // ← manque await ici aussi !

    const accounts = await provider.listAccounts();
    currentAccount = accounts[0];
    document.getElementById('status').textContent = `Connecté avec : ${currentAccount}`;

    nftContract = new ethers.Contract(nftContractAddress, nftContractABI, signer);
    marketplaceContract = new ethers.Contract(marketplaceContractAddress, marketplaceContractABI, signer);
    marketplaceReadContract = new ethers.Contract(marketplaceContractAddress, marketplaceContractABI, provider);

    loadMarketplaceNFTs();
  } else {
    alert("MetaMask non détecté");
  }
}

let isConnecting = false; // <-- Nouveau: pour éviter les spam

async function mintNFT() {
  try {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask non détecté');
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(nftContractAddress, nftContractABI, signer);

    if (!contract.mint) {
      console.error('La fonction mint() n\'existe pas.');
      return;
    }

    // Exemple d'URL de token URI
    const tokenURI = "https://ipfs.io/ipfs/QmQEVVLJUR1WLN15S49rzDJsSP7za9DxeqpUzWuG4aondg";

    // 1. Mint le NFT
    const tx = await contract.mint(tokenURI);
    console.log('Transaction envoyée:', tx.hash);

    // Attendre la confirmation de la transaction et récupérer le receipt
    const receipt = await tx.wait();
    console.log('NFT créé avec succès !');
    console.log('Receipt de la transaction:', receipt);

    const iface = new ethers.Interface([
      "event Minted(address indexed toAddress, uint256 indexed tokenId, string tokenURI)"
    ]);

    for (const log of receipt.logs) {
      try {
        // Tenter de parser le log
        const parsedLog = iface.parseLog(log);
        console.log('Log analysé:', parsedLog);
        
        if (parsedLog.name === "Minted") {
          const toAddress = parsedLog.args.toAddress;
          const tokenId = parsedLog.args.tokenId;
          const tokenURI = parsedLog.args.tokenURI;
          console.log("Event Minted capturé !");
          console.log("toAddress:", toAddress);
          console.log("tokenId:", tokenId.toString());
          console.log("tokenURI:", tokenURI);

          const price = ethers.parseUnits('0.1', 'ether');
          const saleTx = await marketplaceContract.createMarketItem(tokenId, price);
          await saleTx.wait();
          console.log('NFT listé sur le marché avec succès !');
    
        }
      } catch (e) {
        // Si parseLog échoue sur un log non concerné, on ignore
      }
    }

  } catch (error) {
    console.error('Erreur lors de la création du NFT et de la mise en vente sur le marketplace :', error);
  }
}

async function listNFTForSale(tokenId, priceInEther) {
  try {
    const price = ethers.parseEther(priceInEther); // conversion
    const tx = await marketplaceContract.createMarketItem(tokenId, price);
    await tx.wait();
    console.log('NFT listé pour la vente !');
    loadMarketplaceNFTs(); // recharge la liste
  } catch (error) {
    console.error('Erreur lors de la mise en vente du NFT :', error);
  }
}

async function buyNFT(tokenId, price) {
  try {
    const tx = await marketplaceContract.createMarketSale(tokenId, { value: price });
    await tx.wait();
    console.log('NFT acheté avec succès !');
    loadMarketplaceNFTs(); // recharge la liste
  } catch (error) {
    console.error('Erreur lors de l\'achat du NFT :', error);
  }
}

async function loadMarketplaceNFTs() {
  if (!marketplaceReadContract) return;

  try {
    const items = await marketplaceReadContract.fetchMarketItems();  // <= ici, use read contract
    const nftList = document.getElementById('nft-list');
    nftList.innerHTML = '';

    if (items.length === 0) {
      nftList.innerHTML = "<p>Aucun NFT en vente actuellement.</p>";
    }

    console.log("NFTs en vente :", items);

    items.forEach(item => {
      const nftElement = document.createElement('div');
      nftElement.classList.add('nft-item');

      nftElement.innerHTML = `
        <p><strong>Token ID:</strong> ${item.tokenId}</p>
        <p><strong>Prix:</strong> ${ethers.formatEther(item.price)} ETH</p>
        <button class="buy-button" data-token-id="${item.tokenId}" data-price="${item.price}">Acheter</button>
      `;

      nftList.appendChild(nftElement);
    });

    document.querySelectorAll('.buy-button').forEach(button => {
      button.addEventListener('click', async (e) => {
        const tokenId = e.target.getAttribute('data-token-id');
        const price = e.target.getAttribute('data-price');
        await buyNFT(tokenId, price);
      });
    });
    
  } catch (error) {
    console.error("Erreur lors du chargement des NFTs en vente :", error);
  }
}


// Initialisation de l'interface
document.getElementById('mint-button').addEventListener('click', mintNFT);
document.addEventListener('DOMContentLoaded', connectMetaMask);
