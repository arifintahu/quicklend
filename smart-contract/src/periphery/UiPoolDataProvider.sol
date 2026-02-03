// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LendingPool} from "../core/LendingPool.sol";
import {InterestRateModel} from "../core/InterestRateModel.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

import {qToken} from "../tokens/qToken.sol";

import {IUiPoolDataProvider} from "../interfaces/IUiPoolDataProvider.sol";

contract UiPoolDataProvider is IUiPoolDataProvider {
    using FixedPointMathLib for uint256;

    /**
     * @inheritdoc IUiPoolDataProvider
     */
    function getMarketData(LendingPool pool) external view returns (AggregatedMarketData[] memory) {
        address[] memory assets = pool.getMarketList();
        AggregatedMarketData[] memory data = new AggregatedMarketData[](assets.length);

        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            
            // Get Market Struct
            // 1. isListed
            // 2. ltv
            // 3. liqThreshold
            // 4. liqBonus
            // 5. interestRateModel
            // 6. qTokenAddress
            // 7. totalSupplied
            // 8. totalBorrowed
            // 9. borrowIndex
            // 10. lastUpdateTimestamp
            (
                bool isListed,
                uint256 ltv,
                uint256 liqThreshold,
                , 
                InterestRateModel irModel,
                , 
                uint256 totalSupplied,
                uint256 totalBorrowed,
                , 
                
            ) = pool.markets(asset);

            if (!isListed) continue;

            // Get Rates
            uint256 utilization = irModel.getUtilization(totalBorrowed, totalSupplied);
            uint256 borrowRate = irModel.getBorrowRate(utilization);
            uint256 supplyRate = irModel.getSupplyRate(borrowRate, utilization);

            // Get Price
            uint256 price = pool.oracle().getAssetPrice(asset);

            data[i] = AggregatedMarketData({
                asset: asset,
                symbol: IERC20Metadata(asset).symbol(),
                decimals: IERC20Metadata(asset).decimals(),
                ltv: ltv,
                liqThreshold: liqThreshold,
                supplyRate: supplyRate,
                borrowRate: borrowRate,
                totalSupplied: totalSupplied,
                totalBorrowed: totalBorrowed,
                availableLiquidity: IERC20(asset).balanceOf(address(pool)),
                priceUSD: price
            });
        }
        return data;
    }

    /**
     * @inheritdoc IUiPoolDataProvider
     */
    function getUserData(LendingPool pool, address user) external view returns (UserPositionData[] memory) {
        address[] memory assets = pool.getMarketList();
        UserPositionData[] memory data = new UserPositionData[](assets.length);

        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            
            (
                , 
                , 
                , 
                , 
                , 
                qToken qTokenAddr,
                , 
                , 
                uint256 borrowIndex,
                
            ) = pool.markets(asset);

            // Supply Balance
            uint256 supplyBal = IERC20(address(qTokenAddr)).balanceOf(user);

            // Borrow Balance
            uint256 borrowShares = pool.userBorrowShares(asset, user);
            uint256 borrowBal = borrowShares.mulWad(borrowIndex);

            data[i] = UserPositionData({
                asset: asset,
                symbol: IERC20Metadata(asset).symbol(),
                suppliedBalance: supplyBal,
                borrowedBalance: borrowBal,
                isCollateral: pool.userCollateralEnabled(asset, user)
            });
        }
        return data;
    }
}
