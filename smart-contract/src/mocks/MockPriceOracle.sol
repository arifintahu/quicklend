// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

contract MockPriceOracle is IPriceOracle {
    mapping(address => uint256) public prices;

    function setPrice(address asset, uint256 price) external {
        prices[asset] = price;
    }

    function getAssetPrice(address asset) external view override returns (uint256) {
        return prices[asset];
    }
}
