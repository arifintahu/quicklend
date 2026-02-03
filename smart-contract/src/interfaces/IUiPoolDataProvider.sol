// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LendingPool} from "../core/LendingPool.sol";

interface IUiPoolDataProvider {
    struct AggregatedMarketData {
        address asset;
        string symbol;
        uint8 decimals;
        uint256 ltv;
        uint256 liqThreshold;
        uint256 supplyRate;
        uint256 borrowRate;
        uint256 totalSupplied;
        uint256 totalBorrowed;
        uint256 availableLiquidity;
        uint256 priceUSD;
    }

    struct UserPositionData {
        address asset;
        string symbol;
        uint256 suppliedBalance;
        uint256 borrowedBalance;
        bool isCollateral;
    }

    /**
     * @notice Returns aggregated market data for all listed assets.
     * @param pool The LendingPool contract.
     * @return An array of AggregatedMarketData structs.
     */
    function getMarketData(LendingPool pool) external view returns (AggregatedMarketData[] memory);

    /**
     * @notice Returns user position data for all listed assets.
     * @param pool The LendingPool contract.
     * @param user The address of the user.
     * @return An array of UserPositionData structs.
     */
    function getUserData(LendingPool pool, address user) external view returns (UserPositionData[] memory);
}
