// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {InterestRateModel} from "../src/core/InterestRateModel.sol";

contract InterestRateModelTest is Test {
    InterestRateModel model;

    function setUp() public {
        model = new InterestRateModel();
    }

    function test_GetUtilization() public view {
        assertEq(model.getUtilization(0, 100), 0);
        assertEq(model.getUtilization(50e18, 100e18), 0.5e18);
        assertEq(model.getUtilization(100e18, 100e18), 1e18);
    }

    function test_GetUtilization_ZeroSupply() public view {
        // When totalSupplied is 0, utilization should be 0
        assertEq(model.getUtilization(100e18, 0), 0);
    }

    function test_BorrowRate() public view {
        // Base = 0.02e18, Slope = 0.10e18
        // At 0% util: 0.02e18
        assertEq(model.getBorrowRate(0), 0.02e18);

        // At 50% util: 0.02 + (0.5 * 0.10) = 0.02 + 0.05 = 0.07
        assertEq(model.getBorrowRate(0.5e18), 0.07e18);

        // At 100% util: 0.02 + 0.10 = 0.12
        assertEq(model.getBorrowRate(1e18), 0.12e18);
    }

    function test_SupplyRate() public view {
        // SupplyRate = BorrowRate * Utilization * (1 - ReserveFactor)
        // ReserveFactor = 10%

        // At 50% util, borrowRate = 0.07e18
        // SupplyRate = 0.07 * 0.5 * 0.9 = 0.0315
        uint256 borrowRate = model.getBorrowRate(0.5e18);
        uint256 supplyRate = model.getSupplyRate(borrowRate, 0.5e18);
        assertEq(supplyRate, 0.0315e18);

        // At 100% util, borrowRate = 0.12e18
        // SupplyRate = 0.12 * 1.0 * 0.9 = 0.108
        borrowRate = model.getBorrowRate(1e18);
        supplyRate = model.getSupplyRate(borrowRate, 1e18);
        assertEq(supplyRate, 0.108e18);
    }

    function test_GetRates() public view {
        // getRates should return both borrow and supply rates
        (uint256 borrowRate, uint256 supplyRate) = model.getRates(
            50e18,
            100e18
        );

        // At 50% utilization
        assertEq(borrowRate, 0.07e18);
        // SupplyRate = 0.07 * 0.5 * 0.9 = 0.0315
        assertEq(supplyRate, 0.0315e18);
    }

    function test_GetRates_ZeroUtilization() public view {
        (uint256 borrowRate, uint256 supplyRate) = model.getRates(0, 100e18);

        // At 0% utilization, borrowRate = baseRate
        assertEq(borrowRate, 0.02e18);
        // SupplyRate = 0.02 * 0 * 0.9 = 0
        assertEq(supplyRate, 0);
    }
}
