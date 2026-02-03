// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";

import {IInterestRateModel} from "../interfaces/IInterestRateModel.sol";

/**
 * @title InterestRateModel
 * @notice Stateless contract to calculate Borrow and Supply rates based on pool utilization.
 * @dev Uses Solady's FixedPointMathLib for WAD (18 decimal) arithmetic.
 */
contract InterestRateModel is IInterestRateModel {
    using FixedPointMathLib for uint256;

    // Constants (could be made immutable/updatable in future versions)
    uint256 public constant BASE_RATE = 0.02e18;      // 2% Base Rate at 0% utilization
    uint256 public constant SLOPE_1 = 0.10e18;        // 10% Slope
    uint256 public constant RESERVE_FACTOR = 0.10e18; // 10% of interest goes to protocol reserves

    /**
     * @inheritdoc IInterestRateModel
     */
    function getUtilization(uint256 totalBorrowed, uint256 totalSupplied) public pure returns (uint256) {
        if (totalSupplied == 0) return 0;
        return totalBorrowed.divWad(totalSupplied);
    }

    /**
     * @inheritdoc IInterestRateModel
     */
    function getBorrowRate(uint256 utilization) public pure returns (uint256) {
        // Linear Model: Rate = Base + (Utilization * Slope)
        return BASE_RATE + utilization.mulWad(SLOPE_1);
    }

    /**
     * @inheritdoc IInterestRateModel
     */
    function getSupplyRate(uint256 borrowRate, uint256 utilization) public pure returns (uint256) {
        // SupplyRate = BorrowRate * Utilization * (1 - ReserveFactor)
        uint256 grossSupplyRate = borrowRate.mulWad(utilization);
        return grossSupplyRate.mulWad(FixedPointMathLib.WAD - RESERVE_FACTOR);
    }

    /**
     * @inheritdoc IInterestRateModel
     */
    function getRates(uint256 totalBorrowed, uint256 totalSupplied) 
        external 
        pure 
        returns (uint256 borrowRate, uint256 supplyRate) 
    {
        uint256 utilization = getUtilization(totalBorrowed, totalSupplied);
        borrowRate = getBorrowRate(utilization);
        supplyRate = getSupplyRate(borrowRate, utilization);
    }
}
