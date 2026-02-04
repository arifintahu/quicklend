// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LendingPool} from "../src/core/LendingPool.sol";
import {InterestRateModel} from "../src/core/InterestRateModel.sol";
import {MockPriceOracle} from "../src/mocks/MockPriceOracle.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockFeeERC20} from "../src/mocks/MockFeeERC20.sol";
import {qToken} from "../src/tokens/qToken.sol";
import {ILendingPool} from "../src/interfaces/ILendingPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SecurityFixTest is Test {
    LendingPool pool;
    InterestRateModel irModel;
    MockPriceOracle oracle;

    // 18-decimal tokens (default test tokens)
    MockERC20 usdc18;
    MockERC20 weth18;

    // 6-decimal USDC for cross-decimal tests
    MockERC20 usdc6;

    address user1 = address(1);
    address user2 = address(2);
    address liquidator = address(3);

    function setUp() public {
        irModel = new InterestRateModel();
        oracle = new MockPriceOracle();
        pool = new LendingPool(address(oracle));

        usdc18 = new MockERC20("USDC18", "USDC18", 18);
        weth18 = new MockERC20("WETH", "WETH", 18);
        usdc6 = new MockERC20("USDC", "USDC", 6);

        // Init 18-decimal markets
        pool.initMarket(
            address(usdc18), address(irModel),
            0.8e18, 0.85e18, 0.05e18, "qUSDC18", "qUSDC18"
        );
        pool.initMarket(
            address(weth18), address(irModel),
            0.75e18, 0.80e18, 0.05e18, "qWETH", "qWETH"
        );
        // Init 6-decimal USDC market
        pool.initMarket(
            address(usdc6), address(irModel),
            0.8e18, 0.85e18, 0.05e18, "qUSDC6", "qUSDC6"
        );

        // Set prices
        oracle.setPrice(address(usdc18), 1e18);
        oracle.setPrice(address(weth18), 2000e18);
        oracle.setPrice(address(usdc6), 1e18);

        // Fund users
        usdc18.mint(user1, 100_000e18);
        weth18.mint(user1, 100e18);
        usdc6.mint(user1, 100_000e6);
        weth18.mint(user2, 100e18);
        usdc18.mint(user2, 100_000e18);
        weth18.mint(liquidator, 100e18);
        usdc18.mint(liquidator, 100_000e18);

        // Approvals
        vm.startPrank(user1);
        usdc18.approve(address(pool), type(uint256).max);
        weth18.approve(address(pool), type(uint256).max);
        usdc6.approve(address(pool), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(user2);
        usdc18.approve(address(pool), type(uint256).max);
        weth18.approve(address(pool), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(liquidator);
        weth18.approve(address(pool), type(uint256).max);
        usdc18.approve(address(pool), type(uint256).max);
        vm.stopPrank();
    }

    // ==================== C-01: Cross-Decimal Liquidation ====================

    function test_C01_CrossDecimalLiquidation() public {
        // user2 supplies WETH for borrow liquidity
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);

        // user1 supplies 5000 USDC (6 decimals) and borrows 1.5 WETH
        vm.startPrank(user1);
        pool.supply(address(usdc6), 5000e6);
        pool.borrow(address(weth18), 1.5e18);
        vm.stopPrank();

        // Crash USDC price to $0.40
        oracle.setPrice(address(usdc6), 0.4e18);

        // Health factor check: (5000 * 0.4 * 0.85) / (1.5 * 2000) = 1700 / 3000 = 0.567 < 1
        assertTrue(pool.getUserHealthFactor(user1) < 1e18);

        // Liquidator covers 0.5 WETH of debt
        vm.prank(liquidator);
        pool.liquidate(address(usdc6), address(weth18), user1, 0.5e18);

        // Expected collateral seized:
        //   normalizedDebt = 0.5e18 (WETH is 18 decimals)
        //   debtValueUsd = 0.5 * $2000 = $1000
        //   collateralValueUsd = $1000 * 1.05 = $1050
        //   normalizedCollateral = $1050 / $0.40 = 2625 (in 18-dec)
        //   collateralAmount = 2625e18 / 1e12 = 2625e6 (6-decimal USDC)
        (, , , , , qToken qUsdc6, , , , ) = pool.markets(address(usdc6));
        uint256 liquidatorQBalance = qUsdc6.balanceOf(liquidator);
        assertEq(liquidatorQBalance, 2625e6, "Liquidator should receive 2625 qUSDC6");
    }

    function test_C01_SameDecimalLiquidationStillWorks() public {
        // Verify the fix doesn't break same-decimal (18/18) liquidations
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);

        vm.startPrank(user1);
        pool.supply(address(usdc18), 4000e18);
        pool.borrow(address(weth18), 1.5e18);
        vm.stopPrank();

        oracle.setPrice(address(usdc18), 0.7e18);

        vm.prank(liquidator);
        pool.liquidate(address(usdc18), address(weth18), user1, 0.5e18);

        (, , , , , qToken qUsdc, , , , ) = pool.markets(address(usdc18));
        // debtValue = 0.5 * 2000 = 1000; collValue = 1000 * 1.05 = 1050
        // collateralAmount = 1050 / 0.7 = 1500e18
        assertEq(qUsdc.balanceOf(liquidator), 1500e18);
    }

    // ==================== C-02: qToken Transfer Health Check ====================

    function test_C02_qTokenTransferRevertsIfUnhealthy() public {
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);

        vm.startPrank(user1);
        pool.supply(address(usdc18), 5000e18);
        pool.borrow(address(weth18), 1e18); // $2000 debt, HF ≈ 2.125
        vm.stopPrank();

        (, , , , , qToken qUsdc, , , , ) = pool.markets(address(usdc18));

        // Transferring 4000 qUSDC would leave 1000 qUSDC backing $2000 debt
        // HF = (1000 * 0.85) / 2000 = 0.425 → unhealthy, should revert
        vm.prank(user1);
        vm.expectRevert(ILendingPool.HealthFactorTooLow.selector);
        qUsdc.transfer(user2, 4000e18);
    }

    function test_C02_qTokenTransferAllowedIfHealthy() public {
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);

        vm.startPrank(user1);
        pool.supply(address(usdc18), 5000e18);
        pool.borrow(address(weth18), 1e18); // $2000 debt
        vm.stopPrank();

        (, , , , , qToken qUsdc, , , , ) = pool.markets(address(usdc18));

        // Transferring 1000 qUSDC leaves 4000 qUSDC backing $2000 debt
        // HF = (4000 * 0.85) / 2000 = 1.70 → healthy, should succeed
        vm.prank(user1);
        qUsdc.transfer(user2, 1000e18);

        assertEq(qUsdc.balanceOf(user1), 4000e18);
        assertEq(qUsdc.balanceOf(user2), 1000e18);
    }

    function test_C02_qTokenTransferNoCheckWithoutDebt() public {
        // User with no debt can freely transfer all qTokens
        vm.prank(user1);
        pool.supply(address(usdc18), 5000e18);

        (, , , , , qToken qUsdc, , , , ) = pool.markets(address(usdc18));

        vm.prank(user1);
        qUsdc.transfer(user2, 5000e18);
        assertEq(qUsdc.balanceOf(user2), 5000e18);
    }

    // ==================== H-01/H-02: Stale Interest Accrual ====================

    function test_H01_BorrowAccruesAllUserMarkets() public {
        // user2 supplies for liquidity
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);
        vm.prank(user2);
        pool.supply(address(usdc18), 50_000e18);

        // user1 borrows from BOTH markets
        vm.startPrank(user1);
        pool.supply(address(usdc18), 10_000e18);
        pool.borrow(address(weth18), 1e18);   // borrow WETH
        pool.borrow(address(usdc18), 1000e18); // borrow USDC
        vm.stopPrank();

        // Warp 1 year
        vm.warp(block.timestamp + 365 days);

        // When user1 borrows more WETH, _accrueAllUserMarkets should accrue BOTH markets
        // The USDC market interest should be accrued even though user1 is borrowing WETH
        (, , , , , , , uint256 usdcBorrowedBefore, , ) = pool.markets(address(usdc18));

        vm.prank(user1);
        pool.borrow(address(weth18), 0.001e18); // triggers accrual

        (, , , , , , , uint256 usdcBorrowedAfter, , ) = pool.markets(address(usdc18));

        // USDC market totalBorrowed should have increased (interest accrued)
        assertTrue(
            usdcBorrowedAfter > usdcBorrowedBefore,
            "USDC market interest should be accrued when borrowing WETH"
        );
    }

    function test_H02_CollateralToggleAccruesInterest() public {
        // user2 supplies for liquidity
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);

        // user1 supplies USDC and WETH, borrows WETH
        vm.startPrank(user1);
        pool.supply(address(usdc18), 10_000e18);
        pool.supply(address(weth18), 5e18);
        pool.borrow(address(weth18), 0.5e18);
        vm.stopPrank();

        // Warp
        vm.warp(block.timestamp + 365 days);

        (, , , , , , , uint256 wethBorrowedBefore, , ) = pool.markets(address(weth18));

        // Disabling WETH collateral triggers _accrueAllUserMarkets
        // (WETH collateral is small, but the borrow interest should still accrue)
        vm.prank(user1);
        pool.setUserUseReserveAsCollateral(address(weth18), false);

        (, , , , , , , uint256 wethBorrowedAfter, , ) = pool.markets(address(weth18));
        assertTrue(
            wethBorrowedAfter > wethBorrowedBefore,
            "Interest should be accrued when toggling collateral"
        );
    }

    // ==================== H-03: Oracle Timelock ====================

    function test_H03_OracleTimelockEnforced() public {
        MockPriceOracle newOracle = new MockPriceOracle();

        // Step 1: Propose
        pool.proposeOracle(address(newOracle));
        assertEq(pool.pendingOracle(), address(newOracle));

        // Step 2: Cannot confirm before timelock
        vm.expectRevert(ILendingPool.OracleTimelockNotMet.selector);
        pool.confirmOracle();

        // Step 3: Partial wait — still too early
        vm.warp(block.timestamp + 47 hours);
        vm.expectRevert(ILendingPool.OracleTimelockNotMet.selector);
        pool.confirmOracle();

        // Step 4: Wait full timelock
        vm.warp(block.timestamp + 1 hours + 1);
        pool.confirmOracle();

        assertEq(address(pool.oracle()), address(newOracle));
        assertEq(pool.pendingOracle(), address(0));
    }

    function test_H03_ConfirmOracleRevertsIfNoneProposed() public {
        vm.expectRevert(ILendingPool.ZeroAddress.selector);
        pool.confirmOracle();
    }

    // ==================== H-04: Deep Underwater Liquidation (Capped Seize) ====================

    function test_H04_DeepUnderwaterLiquidationCapsCollateral() public {
        // user2 supplies WETH for borrow liquidity
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);

        // user1 supplies 1000 USDC, borrows near max (0.38 WETH = $760, LTV check: 1000*0.8/760 ≈ 1.05)
        vm.startPrank(user1);
        pool.supply(address(usdc18), 1000e18);
        pool.borrow(address(weth18), 0.38e18);
        vm.stopPrank();

        // Crash USDC to $0.10 → deeply underwater
        // HF = (1000 * 0.1 * 0.85) / (0.38 * 2000) = 85 / 760 = 0.112
        oracle.setPrice(address(usdc18), 0.1e18);
        assertTrue(pool.getUserHealthFactor(user1) < 0.2e18);

        (, , , , , qToken qUsdc, , , , ) = pool.markets(address(usdc18));
        uint256 userQBalanceBefore = qUsdc.balanceOf(user1);

        // Liquidator covers half the debt: 0.19 WETH
        // Calculated seize = 0.19 * 2000 * 1.05 / 0.1 = 3990 qUSDC
        // But user only has 1000 qUSDC → cap to 1000
        vm.prank(liquidator);
        pool.liquidate(address(usdc18), address(weth18), user1, 0.19e18);

        // Liquidator receives the capped amount (all of user's collateral)
        uint256 liquidatorReceived = qUsdc.balanceOf(liquidator);
        assertEq(liquidatorReceived, userQBalanceBefore, "Seize should be capped to available balance");
        assertEq(qUsdc.balanceOf(user1), 0, "User should have 0 qUSDC after capped seize");
    }

    // ==================== H-05: Fee-on-Transfer Accounting ====================

    function test_H05_FeeOnTransferSupplyAccountsCorrectly() public {
        MockFeeERC20 feeToken = new MockFeeERC20("FEE", "FEE", 18);
        oracle.setPrice(address(feeToken), 1e18);
        pool.initMarket(
            address(feeToken), address(irModel),
            0.8e18, 0.85e18, 0.05e18, "qFEE", "qFEE"
        );

        feeToken.mint(user1, 10_000e18);
        vm.prank(user1);
        feeToken.approve(address(pool), type(uint256).max);

        vm.prank(user1);
        pool.supply(address(feeToken), 1000e18);

        // 2% fee → actual received = 980e18
        (, , , , , qToken qFee, uint256 totalSupplied, , , ) = pool.markets(address(feeToken));
        assertEq(totalSupplied, 980e18, "totalSupplied should reflect actual received amount");
        assertEq(qFee.balanceOf(user1), 980e18, "qToken minted should match actual received");
    }

    function test_H05_FeeOnTransferRepayAccountsCorrectly() public {
        MockFeeERC20 feeToken = new MockFeeERC20("FEE", "FEE", 18);
        oracle.setPrice(address(feeToken), 1e18);
        pool.initMarket(
            address(feeToken), address(irModel),
            0.8e18, 0.85e18, 0.05e18, "qFEE", "qFEE"
        );

        // user2 supplies for borrow liquidity
        feeToken.mint(user2, 50_000e18);
        vm.prank(user2);
        feeToken.approve(address(pool), type(uint256).max);
        vm.prank(user2);
        pool.supply(address(feeToken), 50_000e18);

        // user1 supplies USDC collateral, borrows fee token
        vm.startPrank(user1);
        pool.supply(address(usdc18), 5000e18);

        feeToken.mint(user1, 10_000e18);
        feeToken.approve(address(pool), type(uint256).max);
        pool.borrow(address(feeToken), 100e18);

        // Repay 50 tokens (pool receives 49 due to 2% fee)
        pool.repay(address(feeToken), 50e18);
        vm.stopPrank();

        // User should still have remaining debt (partial repay with reduced amount)
        uint256 remainingShares = pool.userBorrowShares(address(feeToken), user1);
        assertTrue(remainingShares > 0, "User should still have debt after partial repay");
    }

    // ==================== M-01: MAX_MARKETS Cap ====================

    function test_M01_MaxMarketsRevert() public {
        // Already have 3 markets from setUp (usdc18, weth18, usdc6)
        // Add 17 more to reach MAX_MARKETS (20)
        for (uint256 i = 0; i < 17; i++) {
            MockERC20 token = new MockERC20(
                string(abi.encodePacked("TKN", vm.toString(i))),
                string(abi.encodePacked("TKN", vm.toString(i))),
                18
            );
            oracle.setPrice(address(token), 1e18);
            pool.initMarket(
                address(token), address(irModel),
                0.7e18, 0.8e18, 0.05e18,
                string(abi.encodePacked("qTKN", vm.toString(i))),
                string(abi.encodePacked("qTKN", vm.toString(i)))
            );
        }

        // 21st market should revert
        MockERC20 oneMore = new MockERC20("EXTRA", "EXTRA", 18);
        oracle.setPrice(address(oneMore), 1e18);
        vm.expectRevert(ILendingPool.MaxMarketsReached.selector);
        pool.initMarket(
            address(oneMore), address(irModel),
            0.7e18, 0.8e18, 0.05e18, "qEXTRA", "qEXTRA"
        );
    }

    // ==================== M-05: Self-Liquidation Prevention ====================

    function test_M05_SelfLiquidationReverts() public {
        vm.prank(user2);
        pool.supply(address(weth18), 50e18);

        vm.startPrank(user1);
        pool.supply(address(usdc18), 4000e18);
        pool.borrow(address(weth18), 1.5e18);
        vm.stopPrank();

        // Crash price to make user1 unhealthy
        oracle.setPrice(address(usdc18), 0.7e18);
        assertTrue(pool.getUserHealthFactor(user1) < 1e18);

        // user1 tries to self-liquidate → should revert
        vm.prank(user1);
        vm.expectRevert(ILendingPool.SelfLiquidationNotAllowed.selector);
        pool.liquidate(address(usdc18), address(weth18), user1, 0.5e18);
    }

    // ==================== L-04: Market Listing Checks in Liquidate ====================

    function test_L04_LiquidateRevertsUnlistedCollateral() public {
        MockERC20 unlisted = new MockERC20("UNL", "UNL", 18);

        vm.prank(liquidator);
        vm.expectRevert(ILendingPool.MarketNotListed.selector);
        pool.liquidate(address(unlisted), address(weth18), user1, 1e18);
    }

    function test_L04_LiquidateRevertsUnlistedBorrow() public {
        MockERC20 unlisted = new MockERC20("UNL", "UNL", 18);

        vm.prank(liquidator);
        vm.expectRevert(ILendingPool.MarketNotListed.selector);
        pool.liquidate(address(usdc18), address(unlisted), user1, 1e18);
    }

    // ==================== C-02 Additional: CallerNotQToken ====================

    function test_C02_CheckHealthRejectsNonQToken() public {
        vm.prank(user1);
        vm.expectRevert(ILendingPool.CallerNotQToken.selector);
        pool.checkHealthAfterTransfer(user1);
    }
}
