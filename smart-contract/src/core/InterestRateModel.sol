// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";

/**
 * @title InterestRateModel
 * @notice Stateless contract to calculate Borrow and Supply rates based on pool utilization.
 * @dev Uses Solady's FixedPointMathLib for WAD (18 decimal) arithmetic.
 */
contract InterestRateModel {
    using FixedPointMathLib for uint256;

    // Constants (could be made immutable/updatable in future versions)
    uint256 public constant BASE_RATE = 0.02e18;      // 2% Base Rate at 0% utilization
    uint256 public constant SLOPE_1 = 0.10e18;        // 10% Slope
    uint256 public constant RESERVE_FACTOR = 0.10e18; // 10% of interest goes to protocol reserves

    /**
     * @notice Calculates the utilization rate of the pool.
     * @param totalBorrowed Total assets currently borrowed.
     * @param totalSupplied Total assets currently supplied.
     * @return utilization The utilization ratio in WAD (e.g., 0.5e18 = 50%).
     */
    function getUtilization(uint256 totalBorrowed, uint256 totalSupplied) public pure returns (uint256) {
        if (totalSupplied == 0) return 0;
        return totalBorrowed.divWad(totalSupplied);
    }

    /**
     * @notice Calculates the current Borrow Rate (APY).
     * @param utilization The current utilization ratio in WAD.
     * @return The borrow rate in WAD.
     */
    function getBorrowRate(uint256 utilization) public pure returns (uint256) {
        // Linear Model: Rate = Base + (Utilization * Slope)
        return BASE_RATE + utilization.mulWad(SLOPE_1);
    }

    /**
     * @notice Calculates the current Supply Rate (APY).
     * @param borrowRate The current borrow rate in WAD.
     * @param utilization The current utilization ratio in WAD.
     * @return The supply rate in WAD.
     */
    function getSupplyRate(uint256 borrowRate, uint256 utilization) public pure returns (uint256) {
        // SupplyRate = BorrowRate * Utilization * (1 - ReserveFactor)
        uint256 grossSupplyRate = borrowRate.mulWad(utilization);
        return grossSupplyRate.mulWad(FixedPointMathLib.WAD - RESERVE_FACTOR);
    }

    /**
     * @notice Helper to get both rates at once based on pool state.
     * @param totalBorrowed Total assets borrowed.
     * @param totalSupplied Total assets supplied.
     * @return borrowRate The calculated borrow rate.
     * @return supplyRate The calculated supply rate.
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
