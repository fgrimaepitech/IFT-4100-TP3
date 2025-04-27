// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    // Définition de l'événement pour le mint des NFT
    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("ArtNFT", "ART") Ownable(msg.sender) {}

    // Fonction publique pour mint un NFT
    function mint(string memory tokenURI) public {
        _mintNFT(msg.sender, tokenURI);
    }

    // Fonction interne pour mint un NFT
    function _mintNFT(address to, string memory tokenURI) internal onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenIdCounter++;

        // Émettre l'événement "Minted" pour notifier le mint d'un NFT
        emit Minted(msg.sender, tokenId, tokenURI);
    }

    // Fonction pour associer un URI au token (peut être stocké sur IPFS ou autre)
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        // Logique pour associer un URI aux NFT
        // Cela pourrait impliquer un stockage sur IPFS ou un autre stockage décentralisé
    }
}
