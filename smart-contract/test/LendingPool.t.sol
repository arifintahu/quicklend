// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LendingPool} from "../src/core/LendingPool.sol";
import {InterestRateModel} from "../src/core/InterestRateModel.sol";
import {MockPriceOracle} from "../src/core/MockPriceOracle.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {qToken} from "../src/tokens/qToken.sol";

contract LendingPoolTest is Test {
    LendingPool pool;
    InterestRateModel irModel;
    MockPriceOracle oracle;
    MockERC20 usdc;
    MockERC20 weth;

    address user1 = address(1);
    address user2 = address(2);

    function setUp() public {
        irModel = new InterestRateModel();
        oracle = new MockPriceOracle();
        pool = new LendingPool(address(oracle));

        usdc = new MockERC20("USDC", "USDC");
        weth = new MockERC20("WETH", "WETH");

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
}
