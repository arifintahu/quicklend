// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LendingPool} from "../src/core/LendingPool.sol";
import {InterestRateModel} from "../src/core/InterestRateModel.sol";
import {MockPriceOracle} from "../src/core/MockPriceOracle.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {qToken} from "../src/tokens/qToken.sol";
import {UiPoolDataProvider} from "../src/periphery/UiPoolDataProvider.sol";

contract LendingPoolTest is Test {
    LendingPool pool;
    InterestRateModel irModel;
    MockPriceOracle oracle;
    MockERC20 usdc;
    MockERC20 weth;
    UiPoolDataProvider uiDataProvider;

    address user1 = address(1);
    address user2 = address(2);

    function setUp() public {
        irModel = new InterestRateModel();
        oracle = new MockPriceOracle();
        pool = new LendingPool(address(oracle));
        uiDataProvider = new UiPoolDataProvider();

        usdc = new MockERC20("USDC", "USDC", 18);
        weth = new MockERC20("WETH", "WETH", 18);

        // Init Markets
        pool.initMarket(address(usdc), address(irModel), 0.8e18, 0.85e18, 0.05e18, "qUSDC", "qUSDC");
        pool.initMarket(address(weth), address(irModel), 0.75e18, 0.80e18, 0.05e18, "qWETH", "qWETH");

        // Set Prices
        oracle.setPrice(address(usdc), 1e18); // $1
        oracle.setPrice(address(weth), 2000e18); // $2000

        // Mint tokens to users
        usdc.mint(user1, 10000e18);
        weth.mint(address(pool), 100e18); // Give pool some liquidity for borrowing (usually comes from suppliers)
        // Wait, pool needs WETH liquidity to be borrowed.
        // User 2 supplies WETH
        weth.mint(user2, 100e18);
        
        vm.prank(user1);
        usdc.approve(address(pool), type(uint256).max);
        
        vm.prank(user2);
        weth.approve(address(pool), type(uint256).max);
    }

    function test_Supply() public {
        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);
        
        // Check qToken balance
        (,,,,, qToken qTokenAddr,,,,) = pool.markets(address(usdc));
        assertEq(qToken(qTokenAddr).balanceOf(user1), 1000e18);
        vm.stopPrank();
    }

    function test_Borrow() public {
        // 1. User 2 supplies WETH (Liquidity provider)
        vm.prank(user2);
        pool.supply(address(weth), 10e18);

        // 2. User 1 supplies USDC (Collateral)
        vm.prank(user1);
        pool.supply(address(usdc), 5000e18); // $5000 collateral

        // 3. User 1 borrows WETH
        // Max LTV = 80% of $5000 = $4000
        // WETH Price = $2000. Max Borrow = 2 WETH.
        
        vm.startPrank(user1);
        pool.borrow(address(weth), 1e18); // Borrow 1 WETH ($2000)
        assertEq(weth.balanceOf(user1), 1e18);
        
        // Try borrowing too much (another 1.1 WETH -> Total 2.1 WETH = $4200 > $4000)
        vm.expectRevert(LendingPool.HealthFactorTooLow.selector);
        pool.borrow(address(weth), 1.1e18);
        vm.stopPrank();
    }
    
    function test_Liquidation() public {
        // Setup: User 1 borrows max
        vm.prank(user2);
        pool.supply(address(weth), 10e18);
        
        vm.startPrank(user1);
        pool.supply(address(usdc), 4000e18); // $4000 Collateral
        // LTV 80% -> $3200 Borrow Power
        // Borrow 1.5 WETH ($3000) -> HF = (4000 * 0.85) / 3000 = 3400 / 3000 = 1.13 OK
        pool.borrow(address(weth), 1.5e18);
        vm.stopPrank();
        
        // Drop WETH price or USDC price?
        // Let's drop USDC price (Collateral value drops)
        // USDC $1 -> $0.7
        // Collateral = 4000 * 0.7 = $2800
        // Debt = $3000
        // HF = (2800 * 0.85) / 3000 = 2380 / 3000 = 0.79 < 1.0 -> Liquidatable
        
        oracle.setPrice(address(usdc), 0.7e18);
        
        // User 2 liquidates User 1
        // Repay 0.5 WETH ($1000 worth at old price, but now WETH is still $2000)
        // Debt to cover = 0.5 WETH
        
        vm.startPrank(user2);
        weth.mint(user2, 10e18); // Ensure liquidator has funds
        weth.approve(address(pool), type(uint256).max);
        
        pool.liquidate(address(usdc), address(weth), user1, 0.5e18);
        
        // Check User 1 debt reduced
        // Check User 2 received qUSDC (Collateral)
        // Collateral Seized = DebtVal * (1 + Bonus)
        // DebtVal = 0.5 * 2000 = $1000
        // Bonus = 5% -> $1050
        // USDC Price = $0.7
        // USDC Amount = 1050 / 0.7 = 1500 USDC
        
        (,,,,, qToken qUSDC,,,,) = pool.markets(address(usdc));
        assertEq(qToken(qUSDC).balanceOf(user2), 1500e18);
        vm.stopPrank();
    }

    function test_CollateralToggle() public {
        // User 1 supplies USDC
        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);
        
        // Should be enabled by default
        assertTrue(pool.userCollateralEnabled(address(usdc), user1));
        
        // Disable Collateral
        pool.setUserUseReserveAsCollateral(address(usdc), false);
        assertFalse(pool.userCollateralEnabled(address(usdc), user1));
        
        // Try to borrow -> Should fail as 0 collateral
        vm.expectRevert(LendingPool.HealthFactorTooLow.selector);
        pool.borrow(address(weth), 0.1e18);
        
        // Re-enable
        pool.setUserUseReserveAsCollateral(address(usdc), true);
        assertTrue(pool.userCollateralEnabled(address(usdc), user1));
        
        // Borrow should work
        pool.borrow(address(weth), 0.1e18);
        
        // Try to disable while borrowing -> Should fail
        vm.expectRevert(LendingPool.HealthFactorTooLow.selector);
        pool.setUserUseReserveAsCollateral(address(usdc), false);
        
        vm.stopPrank();
    }

    function test_qTokenDecimals() public {
        // Deploy a 6 decimal token
        MockERC20 usdt = new MockERC20("USDT", "USDT", 6);
        pool.initMarket(address(usdt), address(irModel), 0.8e18, 0.85e18, 0.05e18, "qUSDT", "qUSDT");
        
        (,,,,, qToken qUSDT,,,,) = pool.markets(address(usdt));
        assertEq(qToken(qUSDT).decimals(), 6);
    }

    function test_UiPoolDataProvider() public {
        // Setup some state
        vm.startPrank(user1);
        pool.supply(address(usdc), 1000e18);
        pool.borrow(address(weth), 0.1e18);
        vm.stopPrank();

        UiPoolDataProvider.AggregatedMarketData[] memory marketData = uiDataProvider.getMarketData(pool);
        assertEq(marketData.length, 2);
        
        // Find USDC
        uint256 usdcIndex = keccak256(abi.encodePacked(marketData[0].symbol)) == keccak256(abi.encodePacked("USDC")) ? 0 : 1;
        assertEq(marketData[usdcIndex].totalSupplied, 1000e18);
        
        UiPoolDataProvider.UserPositionData[] memory userData = uiDataProvider.getUserData(pool, user1);
        assertEq(userData.length, 2);
        assertEq(userData[usdcIndex].suppliedBalance, 1000e18);
        assertEq(userData[usdcIndex].isCollateral, true);
    }
}
