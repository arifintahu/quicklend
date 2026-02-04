// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {InterestRateModel} from "../core/InterestRateModel.sol";
import {qToken} from "../tokens/qToken.sol";

interface ILendingPool {
    // Data Structures
    struct Market {
        bool isListed;
        uint256 ltv; // Loan to Value (e.g. 0.8e18)
        uint256 liqThreshold; // Liquidation Threshold (e.g. 0.85e18)
        uint256 liqBonus; // Bonus for liquidators (e.g. 0.05e18)
        InterestRateModel interestRateModel;
        qToken qTokenAddress;
        uint256 totalSupplied; // Total Underlying Supplied
        uint256 totalBorrowed; // Total Underlying Borrowed
        uint256 borrowIndex; // Accumulator for borrow interest (starts at 1e18)
        uint256 lastUpdateTimestamp;
    }

    // Events
    event MarketInitialized(address indexed asset, address qToken);
    event Supply(address indexed asset, address indexed user, uint256 amount);
    event Withdraw(address indexed asset, address indexed user, uint256 amount);
    event Borrow(address indexed asset, address indexed user, uint256 amount);
    event Repay(address indexed asset, address indexed user, uint256 amount);
    event Liquidate(
        address indexed asset,
        address indexed user,
        uint256 amount,
        address liquidator
    );
    event ReserveUsedAsCollateralEnabled(
        address indexed asset,
        address indexed user
    );
    event ReserveUsedAsCollateralDisabled(
        address indexed asset,
        address indexed user
    );
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event OracleUpdateProposed(address indexed newOracle, uint256 executableAt);

    // Errors
    error MarketNotListed();
    error MarketAlreadyListed();
    error InsufficientCollateral();
    error HealthFactorTooLow();
    error AmountZero();
    error TransferFailed();
    error ZeroAddress();
    error InvalidLTV();
    error InvalidThreshold();
    error InvalidBonus();
    error InvalidOraclePrice();
    error NothingToLiquidate();
    error LiquidationTooLarge();
    error MaxMarketsReached();
    error OracleTimelockNotMet();
    error CallerNotQToken();
    error SelfLiquidationNotAllowed();

    /**
     * @notice Initializes a new market.
     * @param asset The address of the underlying asset.
     * @param _irModel The address of the InterestRateModel.
     * @param _ltv The Loan-to-Value ratio (WAD).
     * @param _liqThreshold The Liquidation Threshold (WAD).
     * @param _liqBonus The Liquidation Bonus (WAD).
     * @param _name The name of the qToken.
     * @param _symbol The symbol of the qToken.
     */
    function initMarket(
        address asset,
        address _irModel,
        uint256 _ltv,
        uint256 _liqThreshold,
        uint256 _liqBonus,
        string memory _name,
        string memory _symbol
    ) external;

    /**
     * @notice Sets whether the user wants to use a specific asset as collateral.
     * @param asset The address of the asset.
     * @param useAsCollateral True to enable, false to disable.
     */
    function setUserUseReserveAsCollateral(
        address asset,
        bool useAsCollateral
    ) external;

    /**
     * @notice Supply assets to the pool and receive qTokens.
     * @param asset The address of the asset to supply.
     * @param amount The amount to supply.
     */
    function supply(address asset, uint256 amount) external;

    /**
     * @notice Withdraw assets by burning qTokens.
     * @param asset The address of the asset to withdraw.
     * @param amount The amount to withdraw.
     */
    function withdraw(address asset, uint256 amount) external;

    /**
     * @notice Borrow assets against collateral.
     * @param asset The address of the asset to borrow.
     * @param amount The amount to borrow.
     */
    function borrow(address asset, uint256 amount) external;

    /**
     * @notice Repay borrowed assets.
     * @param asset The address of the asset to repay.
     * @param amount The amount to repay.
     */
    function repay(address asset, uint256 amount) external;

    /**
     * @notice Liquidate an undercollateralized position.
     * @param assetCollateral The address of the collateral asset.
     * @param assetBorrow The address of the borrowed asset.
     * @param user The address of the borrower.
     * @param debtToCover The amount of debt to repay.
     */
    function liquidate(
        address assetCollateral,
        address assetBorrow,
        address user,
        uint256 debtToCover
    ) external;

    /**
     * @notice Returns the list of all listed assets.
     * @return The array of asset addresses.
     */
    function getMarketList() external view returns (address[] memory);

    /**
     * @notice Returns the health factor of a user.
     * @param user The address of the user.
     * @return The health factor scaled by 1e18.
     */
    function getUserHealthFactor(address user) external view returns (uint256);

    /**
     * @notice Returns market data for a specific asset.
     * @param asset The address of the asset.
     * @return isListed Whether the market is listed.
     * @return ltv The Loan-to-Value ratio.
     * @return liqThreshold The Liquidation Threshold.
     * @return liqBonus The Liquidation Bonus.
     * @return interestRateModel The InterestRateModel contract.
     * @return qTokenAddress The qToken contract.
     * @return totalSupplied The total amount supplied.
     * @return totalBorrowed The total amount borrowed.
     * @return borrowIndex The current borrow index.
     * @return lastUpdateTimestamp The last update timestamp.
     */
    function markets(
        address asset
    )
        external
        view
        returns (
            bool isListed,
            uint256 ltv,
            uint256 liqThreshold,
            uint256 liqBonus,
            InterestRateModel interestRateModel,
            qToken qTokenAddress,
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 borrowIndex,
            uint256 lastUpdateTimestamp
        );

    /**
     * @notice Returns the user's borrow shares for a specific asset.
     * @param asset The address of the asset.
     * @param user The address of the user.
     * @return The borrow shares.
     */
    function userBorrowShares(
        address asset,
        address user
    ) external view returns (uint256);

    /**
     * @notice Returns whether a user has enabled a specific asset as collateral.
     * @param asset The address of the asset.
     * @param user The address of the user.
     * @return True if enabled, false otherwise.
     */
    function userCollateralEnabled(
        address asset,
        address user
    ) external view returns (bool);

    /**
     * @notice Proposes a new price oracle. Must wait ORACLE_TIMELOCK before confirming.
     * @param newOracle The address of the new oracle.
     */
    function proposeOracle(address newOracle) external;

    /**
     * @notice Confirms a previously proposed oracle after the timelock has elapsed.
     */
    function confirmOracle() external;

    /**
     * @notice Callback from qToken to verify user health after a direct transfer.
     * @param user The address of the user who sent qTokens.
     */
    function checkHealthAfterTransfer(address user) external;

    /**
     * @notice Pauses the protocol.
     */
    function pause() external;

    /**
     * @notice Unpauses the protocol.
     */
    function unpause() external;
}
