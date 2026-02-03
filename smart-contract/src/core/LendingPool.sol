// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";

import {qToken} from "../tokens/qToken.sol";
import {InterestRateModel} from "./InterestRateModel.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";

contract LendingPool is ReentrancyGuard, Ownable, ILendingPool {
    using SafeERC20 for IERC20;
    using FixedPointMathLib for uint256;

    // State Variables
    mapping(address => Market) public markets; // asset -> Market
    mapping(address => mapping(address => uint256)) public userBorrowShares; // asset -> user -> scaled debt
    mapping(address => mapping(address => bool)) public userCollateralEnabled; // asset -> user -> isCollateral
    address[] public marketList; // List of all assets
    
    IPriceOracle public oracle;

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = IPriceOracle(_oracle);
    }

    // --- Admin Functions ---

    /**
     * @inheritdoc ILendingPool
     */
    function initMarket(
        address asset,
        address _irModel,
        uint256 _ltv,
        uint256 _liqThreshold,
        uint256 _liqBonus,
        string memory _name,
        string memory _symbol
    ) external onlyOwner {
        if (markets[asset].isListed) revert MarketAlreadyListed();

        // Deploy qToken
        qToken newQToken = new qToken(_name, _symbol, asset, address(this));

        markets[asset] = Market({
            isListed: true,
            ltv: _ltv,
            liqThreshold: _liqThreshold,
            liqBonus: _liqBonus,
            interestRateModel: InterestRateModel(_irModel),
            qTokenAddress: newQToken,
            totalSupplied: 0,
            totalBorrowed: 0,
            borrowIndex: 1e18, // Initial index
            lastUpdateTimestamp: block.timestamp
        });

        marketList.push(asset);
        emit MarketInitialized(asset, address(newQToken));
    }

    // --- Core Interaction Functions ---

    /**
     * @inheritdoc ILendingPool
     */
    function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external nonReentrant {
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        if (useAsCollateral == userCollateralEnabled[asset][msg.sender]) return;

        userCollateralEnabled[asset][msg.sender] = useAsCollateral;

        if (useAsCollateral) {
            emit ReserveUsedAsCollateralEnabled(asset, msg.sender);
        } else {
            // Check if user is still healthy after disabling
            if (getUserHealthFactor(msg.sender) < 1e18) {
                revert HealthFactorTooLow();
            }
            emit ReserveUsedAsCollateralDisabled(asset, msg.sender);
        }
    }

    /**
     * @inheritdoc ILendingPool
     */
    function supply(address asset, uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountZero();
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        _accrueInterest(asset);

        // Transfer asset from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        market.totalSupplied += amount; 
        
        // Auto-enable as collateral if first deposit (balance was 0)
        if (market.qTokenAddress.balanceOf(msg.sender) == 0 && !userCollateralEnabled[asset][msg.sender]) {
            userCollateralEnabled[asset][msg.sender] = true;
            emit ReserveUsedAsCollateralEnabled(asset, msg.sender);
        }

        // Mint qTokens
        market.qTokenAddress.mint(msg.sender, amount);

        emit Supply(asset, msg.sender, amount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function withdraw(address asset, uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountZero();
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        _accrueInterest(asset);

        market.qTokenAddress.burn(msg.sender, amount);
        market.totalSupplied -= amount;
        
        // Transfer underlying
        IERC20(asset).safeTransfer(msg.sender, amount);
        
        // Verify Safety (Using Liquidation Threshold - Standard)
        if (getUserHealthFactor(msg.sender) < 1e18) {
            revert HealthFactorTooLow();
        }

        emit Withdraw(asset, msg.sender, amount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function borrow(address asset, uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountZero();
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        _accrueInterest(asset);

        // Update Borrow State
        // Debt = Amount / Index
        uint256 scaledAmount = amount.divWad(market.borrowIndex);
        userBorrowShares[asset][msg.sender] += scaledAmount;
        market.totalBorrowed += amount;

        // Check Health Factor (Using LTV - Stricter for new borrows)
        if (_calculateHealth(msg.sender, true) < 1e18) {
            revert HealthFactorTooLow();
        }

        IERC20(asset).safeTransfer(msg.sender, amount);
        emit Borrow(asset, msg.sender, amount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function repay(address asset, uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountZero();
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        _accrueInterest(asset);

        // Transfer asset from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Reduce Debt
        uint256 debtShares = userBorrowShares[asset][msg.sender];
        uint256 debtAmount = debtShares.mulWad(market.borrowIndex);
        
        if (amount >= debtAmount) {
            // Full Repay
            userBorrowShares[asset][msg.sender] = 0;
            market.totalBorrowed -= debtAmount; 
        } else {
            // Partial Repay
            uint256 sharesToBurn = amount.divWad(market.borrowIndex);
            userBorrowShares[asset][msg.sender] -= sharesToBurn;
            market.totalBorrowed -= amount;
        }

        emit Repay(asset, msg.sender, amount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function liquidate(address assetCollateral, address assetBorrow, address user, uint256 debtToCover) external nonReentrant {
        Market storage marketBorrow = markets[assetBorrow];
        Market storage marketCollateral = markets[assetCollateral];
        
        _accrueInterest(assetBorrow);
        _accrueInterest(assetCollateral);

        // Check Health (Using Liquidation Threshold)
        uint256 healthFactor = getUserHealthFactor(user);
        if (healthFactor >= 1e18) revert("Health factor is fine");

        // Liquidator repays debt
        IERC20(assetBorrow).safeTransferFrom(msg.sender, address(this), debtToCover);
        
        // Update User Debt
        uint256 sharesBurnt = debtToCover.divWad(marketBorrow.borrowIndex);
        userBorrowShares[assetBorrow][user] -= sharesBurnt;
        marketBorrow.totalBorrowed -= debtToCover;

        // Calculate Collateral to Seize (Debt + Bonus)
        uint256 priceBorrow = oracle.getAssetPrice(assetBorrow);
        uint256 priceCollateral = oracle.getAssetPrice(assetCollateral);
        
        uint256 debtValueUSD = debtToCover.mulWad(priceBorrow);
        uint256 collateralValueUSD = debtValueUSD.mulWad(1e18 + marketCollateral.liqBonus);
        uint256 collateralAmount = collateralValueUSD.divWad(priceCollateral);

        // Seize Collateral: Transfer qTokens from User to Liquidator
        // Use `seize` to bypass allowance check (LendingPool is owner of qToken)
        marketCollateral.qTokenAddress.seize(user, msg.sender, collateralAmount);
        
        emit Liquidate(assetCollateral, user, collateralAmount, msg.sender);
    }

    // --- Internal Logic ---

    function _accrueInterest(address asset) internal {
        Market storage market = markets[asset];
        if (block.timestamp == market.lastUpdateTimestamp) return;

        uint256 timeDelta = block.timestamp - market.lastUpdateTimestamp;
        if (timeDelta == 0) return;

        // Calculate Rates
        uint256 borrowRate = market.interestRateModel.getBorrowRate(
            market.interestRateModel.getUtilization(market.totalBorrowed, market.totalSupplied)
        );

        // Calculate Interest
        // Simple Interest for MVP: Rate * Time * Principal
        // Rate is APY.
        uint256 ratePerSecond = borrowRate / 31536000; // 365 days
        uint256 accumulatedFactor = ratePerSecond * timeDelta;
        
        market.borrowIndex = market.borrowIndex + market.borrowIndex.mulWad(accumulatedFactor);
        market.lastUpdateTimestamp = block.timestamp;
        
        // Update Total Borrowed (it grows with interest)
        market.totalBorrowed = market.totalBorrowed + market.totalBorrowed.mulWad(accumulatedFactor);
        // Total Supplied also grows (Supply Side Interest)
        market.totalSupplied = market.totalSupplied + market.totalSupplied.mulWad(accumulatedFactor); 
    }

    // --- View Functions ---

    /**
     * @inheritdoc ILendingPool
     */
    function getMarketList() external view returns (address[] memory) {
        return marketList;
    }

    /**
     * @inheritdoc ILendingPool
     */
    function getUserHealthFactor(address user) public view returns (uint256) {
        return _calculateHealth(user, false); // False = Use Liquidation Threshold
    }

    function _calculateHealth(address user, bool useLTV) internal view returns (uint256) {
        uint256 totalCollateralUSD = 0;
        uint256 totalDebtUSD = 0;

        for (uint256 i = 0; i < marketList.length; i++) {
            address asset = marketList[i];
            Market storage market = markets[asset];

            // Collateral Value
            uint256 collateralBalance = market.qTokenAddress.balanceOf(user);
            if (collateralBalance > 0 && userCollateralEnabled[asset][user]) {
                uint256 price = oracle.getAssetPrice(asset); // USD price 1e18
                uint256 value = collateralBalance.mulWad(price);
                
                uint256 threshold = useLTV ? market.ltv : market.liqThreshold;
                totalCollateralUSD += value.mulWad(threshold);
            }

            // Debt Value
            uint256 borrowShares = userBorrowShares[asset][user];
            if (borrowShares > 0) {
                uint256 debtAmount = borrowShares.mulWad(market.borrowIndex);
                uint256 price = oracle.getAssetPrice(asset);
                totalDebtUSD += debtAmount.mulWad(price);
            }
        }

        if (totalDebtUSD == 0) return type(uint256).max;
        return totalCollateralUSD.divWad(totalDebtUSD);
    }
}
