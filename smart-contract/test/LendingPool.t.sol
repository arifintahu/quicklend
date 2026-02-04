// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LendingPool} from "../src/core/LendingPool.sol";
import {InterestRateModel} from "../src/core/InterestRateModel.sol";
import {MockPriceOracle} from "../src/mocks/MockPriceOracle.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {qToken} from "../src/tokens/qToken.sol";
import {UiPoolDataProvider} from "../src/periphery/UiPoolDataProvider.sol";
import {ILendingPool} from "../src/interfaces/ILendingPool.sol";

contract LendingPoolTest is Test {
    LendingPool pool;
    InterestRateModel irModel;
    MockPriceOracle oracle;
    MockERC20 usdc;
    MockERC20 weth;
    UiPoolDataProvider uiDataProvider;

    address user1 = address(1);
    address user2 = address(2);
    address admin = address(this);

    function setUp() public {
        irModel = new InterestRateModel();
        oracle = new MockPriceOracle();
        pool = new LendingPool(address(oracle));
        uiDataProvider = new UiPoolDataProvider();

        usdc = new MockERC20("USDC", "USDC", 18);
        weth = new MockERC20("WETH", "WETH", 18);

        // Init Markets
        pool.initMarket(
            address(usdc),
            address(irModel),
            0.8e18,
            0.85e18,
            0.05e18,
            "qUSDC",
            "qUSDC"
        );
        pool.initMarket(
            address(weth),
            address(irModel),
            0.75e18,
            0.80e18,
            0.05e18,
            "qWETH",
            "qWETH"
        );

        // Set Prices
        oracle.setPrice(address(usdc), 1e18); // $1
        oracle.setPrice(address(weth), 2000e18); // $2000

        // Mint tokens to users
        usdc.mint(user1, 10000e18);
        weth.mint(user2, 100e18);

        vm.prank(user1);
        usdc.approve(address(pool), type(uint256).max);

        vm.prank(user2);
        weth.approve(address(pool), type(uint256).max);
    }

    // ==================== Supply Tests ====================

    function test_Supply() public {
        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);

        (, , , , , qToken qTokenAddr, , , , ) = pool.markets(address(usdc));
        assertEq(qToken(qTokenAddr).balanceOf(user1), 1000e18);
        vm.stopPrank();
    }

    function test_Supply_RevertZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(ILendingPool.AmountZero.selector);
        pool.supply(address(usdc), 0);
    }

    function test_Supply_RevertMarketNotListed() public {
        MockERC20 unlisted = new MockERC20("UNL", "UNL", 18);
        vm.prank(user1);
        vm.expectRevert(ILendingPool.MarketNotListed.selector);
        pool.supply(address(unlisted), 100e18);
    }

    // ==================== Withdraw Tests ====================

    function test_Withdraw() public {
        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);

        uint256 balanceBefore = usdc.balanceOf(user1);
        pool.withdraw(address(usdc), 500e18);
        uint256 balanceAfter = usdc.balanceOf(user1);

        assertEq(balanceAfter - balanceBefore, 500e18);
        vm.stopPrank();
    }

    function test_Withdraw_RevertZeroAmount() public {
        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);

        vm.expectRevert(ILendingPool.AmountZero.selector);
        pool.withdraw(address(usdc), 0);
        vm.stopPrank();
    }

    function test_Withdraw_RevertMarketNotListed() public {
        MockERC20 unlisted = new MockERC20("UNL", "UNL", 18);
        vm.prank(user1);
        vm.expectRevert(ILendingPool.MarketNotListed.selector);
        pool.withdraw(address(unlisted), 100e18);
    }

    // ==================== Borrow Tests ====================

    function test_Borrow() public {
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.prank(user1);
        pool.supply(address(usdc), 5000e18);

        vm.startPrank(user1);
        pool.borrow(address(weth), 1e18);
        assertEq(weth.balanceOf(user1), 1e18);

        vm.expectRevert(ILendingPool.HealthFactorTooLow.selector);
        pool.borrow(address(weth), 1.1e18);
        vm.stopPrank();
    }

    function test_Borrow_RevertZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(ILendingPool.AmountZero.selector);
        pool.borrow(address(weth), 0);
    }

    function test_Borrow_RevertMarketNotListed() public {
        MockERC20 unlisted = new MockERC20("UNL", "UNL", 18);
        vm.prank(user1);
        vm.expectRevert(ILendingPool.MarketNotListed.selector);
        pool.borrow(address(unlisted), 100e18);
    }

    // ==================== Repay Tests ====================

    function test_Repay() public {
        // Setup: user borrows
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 5000e18);
        pool.borrow(address(weth), 1e18);

        // Repay half
        weth.approve(address(pool), type(uint256).max);
        pool.repay(address(weth), 0.5e18);

        // Check debt reduced
        uint256 borrowShares = pool.userBorrowShares(address(weth), user1);
        assertTrue(borrowShares > 0);
        vm.stopPrank();
    }

    function test_Repay_FullRepayment() public {
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 5000e18);
        pool.borrow(address(weth), 1e18);

        // Mint extra WETH to cover any interest
        weth.mint(user1, 1e18);
        weth.approve(address(pool), type(uint256).max);

        // Repay more than debt (should cap to actual debt)
        pool.repay(address(weth), 2e18);

        // Check debt is zero
        uint256 borrowShares = pool.userBorrowShares(address(weth), user1);
        assertEq(borrowShares, 0);
        vm.stopPrank();
    }

    function test_Repay_RevertZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(ILendingPool.AmountZero.selector);
        pool.repay(address(weth), 0);
    }

    function test_Repay_RevertMarketNotListed() public {
        MockERC20 unlisted = new MockERC20("UNL", "UNL", 18);
        vm.prank(user1);
        vm.expectRevert(ILendingPool.MarketNotListed.selector);
        pool.repay(address(unlisted), 100e18);
    }

    // ==================== Liquidation Tests ====================

    function test_Liquidation() public {
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 4000e18);
        pool.borrow(address(weth), 1.5e18);
        vm.stopPrank();

        oracle.setPrice(address(usdc), 0.7e18);

        vm.startPrank(user2);
        weth.mint(user2, 10e18);
        weth.approve(address(pool), type(uint256).max);

        pool.liquidate(address(usdc), address(weth), user1, 0.5e18);

        (, , , , , qToken qUsdc, , , , ) = pool.markets(address(usdc));
        assertEq(qToken(qUsdc).balanceOf(user2), 1500e18);
        vm.stopPrank();
    }

    function test_Liquidation_RevertHealthy() public {
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 5000e18);
        pool.borrow(address(weth), 1e18);
        vm.stopPrank();

        // User is healthy, liquidation should fail
        vm.startPrank(user2);
        weth.approve(address(pool), type(uint256).max);
        vm.expectRevert(ILendingPool.HealthFactorTooLow.selector);
        pool.liquidate(address(usdc), address(weth), user1, 0.5e18);
        vm.stopPrank();
    }

    function test_Liquidation_RevertNothingToLiquidate() public {
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 4000e18);
        pool.borrow(address(weth), 1.5e18); // Borrow WETH
        vm.stopPrank();

        // Crash collateral price to make user undercollateralized
        oracle.setPrice(address(usdc), 0.7e18);

        // Try to liquidate USDC debt (but user borrowed WETH, not USDC)
        vm.startPrank(user2);
        usdc.mint(user2, 1000e18);
        usdc.approve(address(pool), type(uint256).max);
        vm.expectRevert(ILendingPool.NothingToLiquidate.selector);
        pool.liquidate(address(weth), address(usdc), user1, 100e18); // Wrong asset
        vm.stopPrank();
    }

    // ==================== Collateral Toggle Tests ====================

    function test_CollateralToggle() public {
        // User2 supplies WETH for borrowing liquidity
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);

        assertTrue(pool.userCollateralEnabled(address(usdc), user1));

        pool.setUserUseReserveAsCollateral(address(usdc), false);
        assertFalse(pool.userCollateralEnabled(address(usdc), user1));

        vm.expectRevert(ILendingPool.HealthFactorTooLow.selector);
        pool.borrow(address(weth), 0.1e18);

        pool.setUserUseReserveAsCollateral(address(usdc), true);
        assertTrue(pool.userCollateralEnabled(address(usdc), user1));

        pool.borrow(address(weth), 0.1e18);

        vm.expectRevert(ILendingPool.HealthFactorTooLow.selector);
        pool.setUserUseReserveAsCollateral(address(usdc), false);

        vm.stopPrank();
    }

    function test_CollateralToggle_NoOpSameValue() public {
        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);

        // Already enabled, enabling again should be no-op
        pool.setUserUseReserveAsCollateral(address(usdc), true);
        assertTrue(pool.userCollateralEnabled(address(usdc), user1));
        vm.stopPrank();
    }

    function test_CollateralToggle_RevertMarketNotListed() public {
        MockERC20 unlisted = new MockERC20("UNL", "UNL", 18);
        vm.prank(user1);
        vm.expectRevert(ILendingPool.MarketNotListed.selector);
        pool.setUserUseReserveAsCollateral(address(unlisted), true);
    }

    // ==================== Admin Tests ====================

    function test_InitMarket_RevertZeroAddress() public {
        vm.expectRevert(ILendingPool.ZeroAddress.selector);
        pool.initMarket(
            address(0),
            address(irModel),
            0.8e18,
            0.85e18,
            0.05e18,
            "qTest",
            "qTest"
        );

        MockERC20 newToken = new MockERC20("NEW", "NEW", 18);
        vm.expectRevert(ILendingPool.ZeroAddress.selector);
        pool.initMarket(
            address(newToken),
            address(0),
            0.8e18,
            0.85e18,
            0.05e18,
            "qTest",
            "qTest"
        );
    }

    function test_InitMarket_RevertInvalidLTV() public {
        MockERC20 newToken = new MockERC20("NEW", "NEW", 18);
        // LTV > liqThreshold
        vm.expectRevert(ILendingPool.InvalidLTV.selector);
        pool.initMarket(
            address(newToken),
            address(irModel),
            0.9e18,
            0.85e18,
            0.05e18,
            "qTest",
            "qTest"
        );
    }

    function test_InitMarket_RevertInvalidThreshold() public {
        MockERC20 newToken = new MockERC20("NEW", "NEW", 18);
        // liqThreshold > 1e18
        vm.expectRevert(ILendingPool.InvalidThreshold.selector);
        pool.initMarket(
            address(newToken),
            address(irModel),
            0.8e18,
            1.1e18,
            0.05e18,
            "qTest",
            "qTest"
        );
    }

    function test_InitMarket_RevertInvalidBonus() public {
        MockERC20 newToken = new MockERC20("NEW", "NEW", 18);
        // liqBonus > MAX_LIQ_BONUS (20%)
        vm.expectRevert(ILendingPool.InvalidBonus.selector);
        pool.initMarket(
            address(newToken),
            address(irModel),
            0.8e18,
            0.85e18,
            0.25e18,
            "qTest",
            "qTest"
        );
    }

    function test_InitMarket_RevertAlreadyListed() public {
        vm.expectRevert(ILendingPool.MarketAlreadyListed.selector);
        pool.initMarket(
            address(usdc),
            address(irModel),
            0.8e18,
            0.85e18,
            0.05e18,
            "qTest",
            "qTest"
        );
    }

    function test_SetOracle() public {
        MockPriceOracle newOracle = new MockPriceOracle();
        pool.setOracle(address(newOracle));
        assertEq(address(pool.oracle()), address(newOracle));
    }

    function test_SetOracle_RevertZeroAddress() public {
        vm.expectRevert(ILendingPool.ZeroAddress.selector);
        pool.setOracle(address(0));
    }

    function test_Pause() public {
        pool.pause();

        vm.prank(user1);
        vm.expectRevert();
        pool.supply(address(usdc), 100e18);
    }

    function test_Unpause() public {
        pool.pause();
        pool.unpause();

        vm.prank(user1);
        pool.supply(address(usdc), 100e18);
    }

    // ==================== Constructor Tests ====================

    function test_Constructor_RevertZeroOracle() public {
        vm.expectRevert(ILendingPool.ZeroAddress.selector);
        new LendingPool(address(0));
    }

    // ==================== Interest Accrual Tests ====================

    function test_InterestAccrual() public {
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 5000e18);
        pool.borrow(address(weth), 1e18);
        vm.stopPrank();

        (, , , , , , , uint256 totalBorrowedBefore, , ) = pool.markets(
            address(weth)
        );

        // Warp time forward
        vm.warp(block.timestamp + 365 days);

        // Trigger interest accrual with a supply
        vm.prank(user2);
        pool.supply(address(weth), 0.001e18);

        (, , , , , , , uint256 totalBorrowedAfter, , ) = pool.markets(
            address(weth)
        );

        // Total borrowed should have increased due to interest
        assertTrue(totalBorrowedAfter > totalBorrowedBefore);
    }

    // ==================== Oracle Price Validation Tests ====================

    function test_Borrow_RevertInvalidOraclePrice() public {
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.prank(user1);
        pool.supply(address(usdc), 5000e18);

        // Set price to 0
        oracle.setPrice(address(usdc), 0);

        vm.prank(user1);
        vm.expectRevert(ILendingPool.InvalidOraclePrice.selector);
        pool.borrow(address(weth), 1e18);
    }

    // ==================== qToken Tests ====================

    function test_qTokenDecimals() public {
        MockERC20 usdt = new MockERC20("USDT", "USDT", 6);
        pool.initMarket(
            address(usdt),
            address(irModel),
            0.8e18,
            0.85e18,
            0.05e18,
            "qUSDT",
            "qUSDT"
        );

        (, , , , , qToken qUsdt, , , , ) = pool.markets(address(usdt));
        assertEq(qToken(qUsdt).decimals(), 6);
    }

    // ==================== View Functions Tests ====================

    function test_GetMarketList() public view {
        address[] memory markets = pool.getMarketList();
        assertEq(markets.length, 2);
        assertEq(markets[0], address(usdc));
        assertEq(markets[1], address(weth));
    }

    function test_GetUserHealthFactor_NoDebt() public {
        vm.prank(user1);
        pool.supply(address(usdc), 1000e18);

        uint256 hf = pool.getUserHealthFactor(user1);
        assertEq(hf, type(uint256).max);
    }

    // ==================== UiPoolDataProvider Tests ====================

    function test_UiPoolDataProvider() public {
        // User2 supplies WETH for borrowing liquidity
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);
        pool.borrow(address(weth), 0.1e18);
        vm.stopPrank();

        UiPoolDataProvider.AggregatedMarketData[]
            memory marketData = uiDataProvider.getMarketData(pool);
        assertEq(marketData.length, 2);

        uint256 usdcIndex = keccak256(abi.encodePacked(marketData[0].symbol)) ==
            keccak256(abi.encodePacked("USDC"))
            ? 0
            : 1;
        assertEq(marketData[usdcIndex].totalSupplied, 1000e18);

        UiPoolDataProvider.UserPositionData[] memory userData = uiDataProvider
            .getUserData(pool, user1);
        assertEq(userData.length, 2);
        assertEq(userData[usdcIndex].suppliedBalance, 1000e18);
        assertEq(userData[usdcIndex].isCollateral, true);
    }

    // ==================== Edge Case: Different Decimals ====================

    function test_HealthFactorWithDifferentDecimals() public {
        // User2 supplies WETH for borrowing liquidity
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        // Create a 6 decimal token
        MockERC20 usdt6 = new MockERC20("USDT", "USDT", 6);
        oracle.setPrice(address(usdt6), 1e18);
        pool.initMarket(
            address(usdt6),
            address(irModel),
            0.8e18,
            0.85e18,
            0.05e18,
            "qUSDT",
            "qUSDT"
        );

        // Supply and borrow with 6 decimal token
        usdt6.mint(user1, 10000e6);
        vm.startPrank(user1);
        usdt6.approve(address(pool), type(uint256).max);
        pool.supply(address(usdt6), 5000e6); // 5000 USDT

        // Should be able to borrow based on value not raw amount
        pool.borrow(address(weth), 1e18); // Borrow 1 WETH ($2000)
        vm.stopPrank();
    }
}
