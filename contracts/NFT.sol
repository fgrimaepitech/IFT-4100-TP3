// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    // event pour notifier le mint d'un NFT au front
    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("ArtNFT", "ART") Ownable(msg.sender) {}

    // fonction public pour mint un NFT depuis le front
    function mint(string memory tokenURI) public {
        _mintNFT(msg.sender, tokenURI);
    }

    // fonction interne pour mint un NFT depuis le contract
    function _mintNFT(address to, string memory tokenURI) internal onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenIdCounter++;

        // émettre l'event pour notifier le mint
        emit Minted(msg.sender, tokenId, tokenURI);
    }

    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        // à implémenter pour IPFS si on veut manage vraiment des fichiers
        // ici on l'utilisera toujours la même image
    }
}
