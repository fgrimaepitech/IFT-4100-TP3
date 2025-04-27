// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtMarketplace is Ownable {
    // structure pour un item de marché
    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        uint256 price;
        string tokenURI;
        string name;
        bool isSold;
    }

    mapping(uint256 => MarketItem) public idToMarketItem;
    mapping(address => uint256[]) private ownedNFTs;

    IERC721 private artNFTContract;

    uint256 public marketItemCount;

    constructor(address _artNFTAddress) Ownable(msg.sender) {
        artNFTContract = IERC721(_artNFTAddress);
    }

    // fonction pour créer un item de marché
    // elle est publique pour être accessible depuis le front
    function createMarketItem(uint256 tokenId, string memory tokenURI, string memory name, uint256 price) public {
        require(artNFTContract.ownerOf(tokenId) == msg.sender, "You must own the NFT");
        require(price > 0, "Price must be greater than zero");

        idToMarketItem[tokenId] = MarketItem({
            tokenId: tokenId,
            seller: payable(msg.sender),
            price: price,
            tokenURI: tokenURI,
            name: name,
            isSold: false
        });

        marketItemCount++;
    }

    // fonction pour créer une vente de marché
    // elle est publique pour être accessible depuis le front
    // elle est payable pour recevoir le paiement
    function createMarketSale(uint256 tokenId) public payable {
        MarketItem storage item = idToMarketItem[tokenId];
        require(msg.value == item.price, "Please submit the asking price in order to complete the purchase");
        require(!item.isSold, "This NFT is already sold");

        require(
            artNFTContract.getApproved(tokenId) == address(this) ||
            artNFTContract.isApprovedForAll(item.seller, address(this)),
            "Marketplace contract is not approved to transfer this NFT"
        );

        item.seller.transfer(msg.value);
        artNFTContract.safeTransferFrom(item.seller, msg.sender, tokenId);
        item.isSold = true;

        ownedNFTs[msg.sender].push(tokenId);
    }

    // fonction pour récupérer les items de marché
    // elle est publique pour être accessible depuis le front
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = 0;
        for (uint256 i = 0; i < marketItemCount; i++) {
            if (!idToMarketItem[i].isSold) {
                itemCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < marketItemCount; i++) {
            if (!idToMarketItem[i].isSold) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }

        return items;
    }

    // fonction pour récupérer les items de marché acheté par un utilisateur
    // elle est publique pour être accessible depuis le front
    function fetchOwnedNFTs(address user) public view returns (uint256[] memory) {
        return ownedNFTs[user];
    }
}
