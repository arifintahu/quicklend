// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPriceOracle {
    /**
     * @notice Returns the price of an asset in USD.
     * @param asset The address of the asset (e.g., USDC, WETH).
     * @return price The price scaled by 1e18 (WAD).
     */
    function getAssetPrice(address asset) external view returns (uint256);
}
