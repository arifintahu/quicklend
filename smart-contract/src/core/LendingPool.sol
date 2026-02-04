// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";

import {qToken} from "../tokens/qToken.sol";
import {InterestRateModel} from "./InterestRateModel.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";

contract LendingPool is ReentrancyGuard, Ownable, Pausable, ILendingPool {
    using SafeERC20 for IERC20;
    using FixedPointMathLib for uint256;

    // Constants
    uint256 public constant CLOSE_FACTOR = 0.5e18; // 50% max liquidation per tx
    uint256 public constant MAX_LIQ_BONUS = 0.2e18; // 20% max liquidation bonus
    uint256 public constant MAX_MARKETS = 20; // M-01: cap on number of markets
    uint256 public constant ORACLE_TIMELOCK = 48 hours; // H-03: timelock for oracle changes

    // State Variables
    mapping(address => Market) public markets; // asset -> Market
    mapping(address => mapping(address => uint256)) public userBorrowShares; // asset -> user -> scaled debt
    mapping(address => mapping(address => bool)) public userCollateralEnabled; // asset -> user -> isCollateral
    mapping(address => bool) public isRegisteredQToken; // C-02: track valid qTokens
    address[] public marketList; // List of all assets

    IPriceOracle public oracle;

    // H-03: Oracle timelock state
    address public pendingOracle;
    uint256 public oracleUpdateInitiated;

    constructor(address _oracle) Ownable(msg.sender) {
        if (_oracle == address(0)) revert ZeroAddress();
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
        // Input validation
        if (asset == address(0) || _irModel == address(0)) revert ZeroAddress();
        if (_ltv > _liqThreshold) revert InvalidLTV();
        if (_liqThreshold > 1e18) revert InvalidThreshold();
        if (_liqBonus > MAX_LIQ_BONUS) revert InvalidBonus();
        if (markets[asset].isListed) revert MarketAlreadyListed();
        if (marketList.length >= MAX_MARKETS) revert MaxMarketsReached(); // M-01

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

        isRegisteredQToken[address(newQToken)] = true; // C-02
        marketList.push(asset);
        emit MarketInitialized(asset, address(newQToken));
    }

    // --- Core Interaction Functions ---

    /**
     * @inheritdoc ILendingPool
     */
    function setUserUseReserveAsCollateral(
        address asset,
        bool useAsCollateral
    ) external nonReentrant {
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        if (useAsCollateral == userCollateralEnabled[asset][msg.sender]) return;

        userCollateralEnabled[asset][msg.sender] = useAsCollateral;

        if (useAsCollateral) {
            emit ReserveUsedAsCollateralEnabled(asset, msg.sender);
        } else {
            // H-02: Accrue all user markets before health check
            _accrueAllUserMarkets(msg.sender);
            if (_calculateHealth(msg.sender, false) < 1e18) {
                revert HealthFactorTooLow();
            }
            emit ReserveUsedAsCollateralDisabled(asset, msg.sender);
        }
    }

    /**
     * @inheritdoc ILendingPool
     */
    function supply(
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        _accrueInterest(asset);

        // H-05: Measure actual received amount (fee-on-transfer protection)
        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        uint256 actualAmount = IERC20(asset).balanceOf(address(this)) - balanceBefore;

        market.totalSupplied += actualAmount;

        // Auto-enable as collateral if first deposit (balance was 0)
        if (
            market.qTokenAddress.balanceOf(msg.sender) == 0 &&
            !userCollateralEnabled[asset][msg.sender]
        ) {
            userCollateralEnabled[asset][msg.sender] = true;
            emit ReserveUsedAsCollateralEnabled(asset, msg.sender);
        }

        // Mint qTokens based on actual amount received
        market.qTokenAddress.mint(msg.sender, actualAmount);

        emit Supply(asset, msg.sender, actualAmount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function withdraw(
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        _accrueInterest(asset);

        market.qTokenAddress.burn(msg.sender, amount);
        market.totalSupplied -= amount;

        // M-04 (CEI): Health check BEFORE external transfer
        // H-01: Accrue all user markets for accurate health
        _accrueAllUserMarkets(msg.sender);
        if (_calculateHealth(msg.sender, false) < 1e18) {
            revert HealthFactorTooLow();
        }

        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Withdraw(asset, msg.sender, amount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function borrow(
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        Market storage market = markets[asset];
        if (!market.isListed) revert MarketNotListed();

        _accrueInterest(asset);

        // Update Borrow State
        // Debt = Amount / Index
        uint256 scaledAmount = amount.divWad(market.borrowIndex);
        userBorrowShares[asset][msg.sender] += scaledAmount;
        market.totalBorrowed += amount;

        // H-01: Accrue all user markets before health check
        _accrueAllUserMarkets(msg.sender);
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

        // Calculate actual repayment (cap to debt)
        uint256 debtShares = userBorrowShares[asset][msg.sender];
        uint256 debtAmount = debtShares.mulWad(market.borrowIndex);

        // Cap repayment to actual debt to prevent loss of user funds
        uint256 actualRepayment = amount > debtAmount ? debtAmount : amount;

        // H-05: Measure actual received amount (fee-on-transfer protection)
        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));
        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            actualRepayment
        );
        uint256 actualReceived = IERC20(asset).balanceOf(address(this)) - balanceBefore;

        if (actualReceived >= debtAmount) {
            // Full Repay
            userBorrowShares[asset][msg.sender] = 0;
            market.totalBorrowed -= debtAmount;
        } else {
            // Partial Repay
            uint256 sharesToBurn = actualReceived.divWad(market.borrowIndex);
            userBorrowShares[asset][msg.sender] -= sharesToBurn;
            market.totalBorrowed -= actualReceived;
        }

        emit Repay(asset, msg.sender, actualReceived);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function liquidate(
        address assetCollateral,
        address assetBorrow,
        address user,
        uint256 debtToCover
    ) external nonReentrant whenNotPaused {
        // L-04: Explicit market listing checks
        if (!markets[assetCollateral].isListed) revert MarketNotListed();
        if (!markets[assetBorrow].isListed) revert MarketNotListed();
        // M-05: Prevent self-liquidation
        if (msg.sender == user) revert SelfLiquidationNotAllowed();

        _accrueInterest(assetBorrow);
        _accrueInterest(assetCollateral);

        // H-01: Accrue all user markets for accurate health factor
        _accrueAllUserMarkets(user);

        // Check Health (Using Liquidation Threshold)
        if (_calculateHealth(user, false) >= 1e18) revert HealthFactorTooLow(); // User is healthy, can't liquidate

        // Calculate actual debt to cover
        uint256 actualDebtToCover = _calculateActualDebtToCover(
            assetBorrow,
            user,
            debtToCover
        );

        // M-04 (CEI): Update debt state BEFORE external transfers
        Market storage marketBorrow = markets[assetBorrow];
        uint256 sharesBurnt = actualDebtToCover.divWad(
            marketBorrow.borrowIndex
        );
        userBorrowShares[assetBorrow][user] -= sharesBurnt;
        marketBorrow.totalBorrowed -= actualDebtToCover;

        // Calculate and seize collateral
        uint256 collateralAmount = _seizeCollateral(
            assetCollateral,
            assetBorrow,
            user,
            actualDebtToCover
        );

        // H-05: Fee-on-transfer protection for liquidator payment
        uint256 balanceBefore = IERC20(assetBorrow).balanceOf(address(this));
        IERC20(assetBorrow).safeTransferFrom(
            msg.sender,
            address(this),
            actualDebtToCover
        );
        uint256 actualReceived = IERC20(assetBorrow).balanceOf(address(this)) - balanceBefore;
        if (actualReceived < actualDebtToCover) {
            // If fee-on-transfer reduced the received amount, we've already
            // credited the full debt reduction. Revert to prevent under-payment.
            revert TransferFailed();
        }

        emit Liquidate(assetCollateral, user, collateralAmount, msg.sender);
    }

    /**
     * @dev Calculates actual debt to cover, applying close factor limits.
     */
    function _calculateActualDebtToCover(
        address assetBorrow,
        address user,
        uint256 debtToCover
    ) internal view returns (uint256) {
        uint256 userDebtShares = userBorrowShares[assetBorrow][user];
        uint256 userDebtAmount = userDebtShares.mulWad(
            markets[assetBorrow].borrowIndex
        );
        if (userDebtAmount == 0) revert NothingToLiquidate();

        uint256 maxLiquidatable = userDebtAmount.mulWad(CLOSE_FACTOR);
        uint256 actualDebtToCover = debtToCover > maxLiquidatable
            ? maxLiquidatable
            : debtToCover;

        return
            actualDebtToCover > userDebtAmount
                ? userDebtAmount
                : actualDebtToCover;
    }

    /**
     * @dev Calculates collateral to seize and transfers it to the liquidator.
     *      C-01: Normalizes decimals for cross-decimal liquidations.
     *      H-04: Caps seized amount to available collateral balance.
     */
    function _seizeCollateral(
        address assetCollateral,
        address assetBorrow,
        address user,
        uint256 actualDebtToCover
    ) internal returns (uint256 collateralAmount) {
        // C-01: Normalize debt to 18 decimals before USD calculation
        uint8 borrowDecimals = IERC20Metadata(assetBorrow).decimals();
        uint8 collateralDecimals = IERC20Metadata(assetCollateral).decimals();

        uint256 normalizedDebt = actualDebtToCover;
        if (borrowDecimals < 18) {
            normalizedDebt = actualDebtToCover * 10 ** (18 - borrowDecimals);
        } else if (borrowDecimals > 18) {
            normalizedDebt = actualDebtToCover / 10 ** (borrowDecimals - 18);
        }

        uint256 debtValueUsd = normalizedDebt.mulWad(
            _getValidatedPrice(assetBorrow)
        );
        uint256 collateralValueUsd = debtValueUsd.mulWad(
            1e18 + markets[assetCollateral].liqBonus
        );

        // Result in 18 decimals
        uint256 normalizedCollateral = collateralValueUsd.divWad(
            _getValidatedPrice(assetCollateral)
        );

        // De-normalize to collateral asset's decimals
        if (collateralDecimals < 18) {
            collateralAmount = normalizedCollateral / 10 ** (18 - collateralDecimals);
        } else if (collateralDecimals > 18) {
            collateralAmount = normalizedCollateral * 10 ** (collateralDecimals - 18);
        } else {
            collateralAmount = normalizedCollateral;
        }

        // H-04: Cap to available qToken balance to prevent revert on deep underwater positions
        uint256 availableCollateral = markets[assetCollateral].qTokenAddress.balanceOf(user);
        if (collateralAmount > availableCollateral) {
            collateralAmount = availableCollateral;
        }

        // Seize Collateral: Transfer qTokens from User to Liquidator
        markets[assetCollateral].qTokenAddress.seize(
            user,
            msg.sender,
            collateralAmount
        );
    }

    // --- Internal Logic ---

    function _accrueInterest(address asset) internal {
        Market storage market = markets[asset];
        if (block.timestamp == market.lastUpdateTimestamp) return;

        uint256 timeDelta = block.timestamp - market.lastUpdateTimestamp;
        if (timeDelta == 0) return;

        // Calculate Rates
        uint256 borrowRate = market.interestRateModel.getBorrowRate(
            market.interestRateModel.getUtilization(
                market.totalBorrowed,
                market.totalSupplied
            )
        );

        // Calculate Interest with improved precision
        // Use WAD division for better precision
        uint256 ratePerSecondWad = borrowRate.divWad(31536000e18); // 365 days in WAD
        uint256 accumulatedFactor = ratePerSecondWad * timeDelta;

        // Calculate interest earned from borrowed amount only
        uint256 interestEarned = market.totalBorrowed.mulWad(accumulatedFactor);

        // Update borrow index
        market.borrowIndex =
            market.borrowIndex +
            market.borrowIndex.mulWad(accumulatedFactor);
        market.lastUpdateTimestamp = block.timestamp;

        // Update Total Borrowed (it grows with interest)
        market.totalBorrowed += interestEarned;

        // Supplier interest = borrower interest * (1 - reserve factor)
        // Reserve factor is 10% (0.10e18) from InterestRateModel
        uint256 reserveFactor = market.interestRateModel.RESERVE_FACTOR();
        uint256 supplierInterest = interestEarned.mulWad(1e18 - reserveFactor);
        market.totalSupplied += supplierInterest;
    }

    /**
     * @dev H-01/H-02: Accrues interest for all markets where the user has borrow positions.
     *      Called before health factor calculations to ensure accurate debt values.
     */
    function _accrueAllUserMarkets(address user) internal {
        for (uint256 i = 0; i < marketList.length; i++) {
            address asset = marketList[i];
            if (userBorrowShares[asset][user] > 0) {
                _accrueInterest(asset);
            }
        }
    }

    /**
     * @dev Returns validated price from oracle, reverts if price is 0.
     */
    function _getValidatedPrice(address asset) internal view returns (uint256) {
        uint256 price = oracle.getAssetPrice(asset);
        if (price == 0) revert InvalidOraclePrice();
        return price;
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

    function _calculateHealth(
        address user,
        bool useLtv
    ) internal view returns (uint256) {
        uint256 totalCollateralUsd = 0;
        uint256 totalDebtUsd = 0;

        for (uint256 i = 0; i < marketList.length; i++) {
            address asset = marketList[i];
            Market storage market = markets[asset];

            // Get decimals for normalization
            uint8 decimals = IERC20Metadata(asset).decimals();

            // Collateral Value
            uint256 collateralBalance = market.qTokenAddress.balanceOf(user);
            if (collateralBalance > 0 && userCollateralEnabled[asset][user]) {
                // Normalize to 18 decimals
                uint256 normalizedBalance = collateralBalance;
                if (decimals < 18) {
                    normalizedBalance =
                        collateralBalance *
                        10 ** (18 - decimals);
                } else if (decimals > 18) {
                    normalizedBalance =
                        collateralBalance /
                        10 ** (decimals - 18);
                }

                uint256 price = _getValidatedPrice(asset);
                uint256 value = normalizedBalance.mulWad(price);

                uint256 threshold = useLtv ? market.ltv : market.liqThreshold;
                totalCollateralUsd += value.mulWad(threshold);
            }

            // Debt Value
            uint256 borrowShares = userBorrowShares[asset][user];
            if (borrowShares > 0) {
                uint256 debtAmount = borrowShares.mulWad(market.borrowIndex);

                // Normalize to 18 decimals
                uint256 normalizedDebt = debtAmount;
                if (decimals < 18) {
                    normalizedDebt = debtAmount * 10 ** (18 - decimals);
                } else if (decimals > 18) {
                    normalizedDebt = debtAmount / 10 ** (decimals - 18);
                }

                uint256 price = _getValidatedPrice(asset);
                totalDebtUsd += normalizedDebt.mulWad(price);
            }
        }

        if (totalDebtUsd == 0) return type(uint256).max;
        return totalCollateralUsd.divWad(totalDebtUsd);
    }

    // --- Admin Functions ---

    /**
     * @inheritdoc ILendingPool
     */
    function proposeOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert ZeroAddress();
        pendingOracle = newOracle;
        oracleUpdateInitiated = block.timestamp;
        emit OracleUpdateProposed(newOracle, block.timestamp + ORACLE_TIMELOCK);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function confirmOracle() external onlyOwner {
        if (pendingOracle == address(0)) revert ZeroAddress();
        if (block.timestamp < oracleUpdateInitiated + ORACLE_TIMELOCK)
            revert OracleTimelockNotMet();

        address oldOracle = address(oracle);
        oracle = IPriceOracle(pendingOracle);
        pendingOracle = address(0);
        oracleUpdateInitiated = 0;
        emit OracleUpdated(oldOracle, address(oracle));
    }

    /**
     * @dev C-02: Callback from qToken to verify user health after a direct qToken transfer.
     *      Only callable by registered qTokens.
     */
    function checkHealthAfterTransfer(address user) external {
        if (!isRegisteredQToken[msg.sender]) revert CallerNotQToken();
        _accrueAllUserMarkets(user);
        if (_calculateHealth(user, false) < 1e18) {
            revert HealthFactorTooLow();
        }
    }

    /**
     * @inheritdoc ILendingPool
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @inheritdoc ILendingPool
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
