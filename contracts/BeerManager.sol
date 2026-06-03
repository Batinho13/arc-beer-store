// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BeerManager {
    IERC20 public usdcToken;
    address public owner;

    struct BeerProduct {
        uint256 id;
        string name;
        string brand;
        uint256 price; // in USDC (e.g., 5000000 for 5 USDC if 6 decimals)
        uint256 stock;
    }

    mapping(uint256 => BeerProduct) public products;
    uint256 public productCount;

    event StockUpdated(uint256 indexed productId, uint256 newStock);
    event BeerPurchased(address indexed buyer, uint256 indexed productId, uint256 quantity);

    constructor(address _usdcAddress) {
        usdcToken = IERC20(_usdcAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function addProduct(string memory _name, string memory _brand, uint256 _price, uint256 _stock) public onlyOwner {
        productCount++;
        products[productCount] = BeerProduct(productCount, _name, _brand, _price, _stock);
    }

    function updateStock(uint256 _productId, uint256 _newStock) public onlyOwner {
        products[_productId].stock = _newStock;
        emit StockUpdated(_productId, _newStock);
    }

    function purchaseBeer(uint256 _productId, uint256 _quantity) public {
        BeerProduct storage product = products[_productId];
        require(product.stock >= _quantity, "Not enough stock");
        
        uint256 totalCost = product.price * _quantity;
        require(usdcToken.transferFrom(msg.sender, address(this), totalCost), "Transfer failed");

        product.stock -= _quantity;
        emit BeerPurchased(msg.sender, _productId, _quantity);
    }
}
