// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {LendingPool} from "../src/core/LendingPool.sol";
import {InterestRateModel} from "../src/core/InterestRateModel.sol";
import {MockPriceOracle} from "../src/core/MockPriceOracle.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

contract DeployScript is Script {
    function run() external {
        // Retrieve private key from environment or default to a test key
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcast (uses PRIVATE_KEY env var or --private-key flag)
        vm.startBroadcast();

        // 1. Deploy Core Logic
        InterestRateModel irModel = new InterestRateModel();
        MockPriceOracle oracle = new MockPriceOracle();
        LendingPool pool = new LendingPool(address(oracle));

        // 2. Deploy Mocks (Assets)
        MockERC20 usdc = new MockERC20("USD Coin", "USDC");
        MockERC20 weth = new MockERC20("Wrapped Ether", "WETH");
        MockERC20 wbtc = new MockERC20("Wrapped Bitcoin", "WBTC");

        // 3. Init Markets
        // USDC: Stable -> High LTV (80%), Liq (85%)
        pool.initMarket(address(usdc), address(irModel), 0.80e18, 0.85e18, 0.05e18, "QuickLend USDC", "qUSDC");
        
        // WETH: Volatile -> Med LTV (75%), Liq (80%)
        pool.initMarket(address(weth), address(irModel), 0.75e18, 0.80e18, 0.05e18, "QuickLend WETH", "qWETH");
        
        // WBTC: Volatile -> Med LTV (70%), Liq (75%)
        pool.initMarket(address(wbtc), address(irModel), 0.70e18, 0.75e18, 0.05e18, "QuickLend WBTC", "qWBTC");

        // 4. Setup Oracle Prices (Initial Mock Prices)
        oracle.setPrice(address(usdc), 1e18);     // $1
        oracle.setPrice(address(weth), 2500e18);  // $2500
        oracle.setPrice(address(wbtc), 45000e18); // $45000

        vm.stopBroadcast();
    }
}
