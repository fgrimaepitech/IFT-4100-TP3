// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("ArtNFT", "ART") Ownable(msg.sender) {}

    function mint(string memory tokenURI) public {
        _mintNFT(msg.sender, tokenURI);
    }

    function _mintNFT(address to, string memory tokenURI) internal onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenIdCounter++;

        emit Minted(msg.sender, tokenId, tokenURI);
    }

    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        // à implémenter pour IPFS si on veut manage vraiment des fichiers
    }
}
