// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInterestRateModel {
    /**
     * @notice Calculates the utilization rate of the pool.
     * @param totalBorrowed Total assets currently borrowed.
     * @param totalSupplied Total assets currently supplied.
     * @return utilization The utilization ratio in WAD (e.g., 0.5e18 = 50%).
     */
    function getUtilization(uint256 totalBorrowed, uint256 totalSupplied) external pure returns (uint256);

    /**
     * @notice Calculates the current Borrow Rate (APY).
     * @param utilization The current utilization ratio in WAD.
     * @return The borrow rate in WAD.
     */
    function getBorrowRate(uint256 utilization) external pure returns (uint256);

    /**
     * @notice Calculates the current Supply Rate (APY).
     * @param borrowRate The current borrow rate in WAD.
     * @param utilization The current utilization ratio in WAD.
     * @return The supply rate in WAD.
     */
    function getSupplyRate(uint256 borrowRate, uint256 utilization) external pure returns (uint256);

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
        returns (uint256 borrowRate, uint256 supplyRate);
}
