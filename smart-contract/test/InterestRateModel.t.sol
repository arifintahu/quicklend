// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {InterestRateModel} from "../src/core/InterestRateModel.sol";

contract InterestRateModelTest is Test {
    InterestRateModel model;

    function setUp() public {
        model = new InterestRateModel();
    }

    function test_GetUtilization() public {
        assertEq(model.getUtilization(0, 100), 0);
        assertEq(model.getUtilization(50e18, 100e18), 0.5e18);
        assertEq(model.getUtilization(100e18, 100e18), 1e18);
    }

    function test_BorrowRate() public {
        // Base = 0.02e18, Slope = 0.10e18
        // At 0% util: 0.02e18
        assertEq(model.getBorrowRate(0), 0.02e18);
        
        // At 50% util: 0.02 + (0.5 * 0.10) = 0.02 + 0.05 = 0.07
        assertEq(model.getBorrowRate(0.5e18), 0.07e18);
        
        // At 100% util: 0.02 + 0.10 = 0.12
        assertEq(model.getBorrowRate(1e18), 0.12e18);
    }
}
