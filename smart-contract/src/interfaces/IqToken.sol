// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IqToken is IERC20, IERC20Metadata {
    /**
     * @notice Returns the address of the underlying asset.
     */
    function UNDERLYING_ASSET() external view returns (address);

    /**
     * @notice Mints qTokens to a user. Only callable by LendingPool.
     * @param to The recipient address.
     * @param amount The amount to mint.
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burns qTokens from a user. Only callable by LendingPool.
     * @param from The address to burn from.
     * @param amount The amount to burn.
     */
    function burn(address from, uint256 amount) external;

    /**
     * @notice Transfers qTokens during liquidation. Only callable by LendingPool.
     * @param from The borrower address.
     * @param to The liquidator address.
     * @param amount The amount to transfer.
     */
    function seize(address from, address to, uint256 amount) external;
}
