// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title qToken
 * @notice Yield-bearing token representing a user's share in the LendingPool.
 * @dev Controlled by the LendingPool contract (Owner).
 */
contract qToken is ERC20, Ownable {
    address public immutable UNDERLYING_ASSET;

    /**
     * @param name Token Name (e.g., "QuickLend USDC")
     * @param symbol Token Symbol (e.g., "qUSDC")
     * @param _underlyingAsset The ERC20 asset this token wraps.
     * @param _lendingPool The address of the LendingPool (initial owner).
     */
    constructor(
        string memory name, 
        string memory symbol, 
        address _underlyingAsset,
        address _lendingPool
    ) ERC20(name, symbol) Ownable(_lendingPool) {
        UNDERLYING_ASSET = _underlyingAsset;
    }

    /**
     * @notice Mints qTokens to a user. Only callable by LendingPool.
     * @param to The recipient address.
     * @param amount The amount to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burns qTokens from a user. Only callable by LendingPool.
     * @param from The address to burn from.
     * @param amount The amount to burn.
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @notice Transfers qTokens during liquidation. Only callable by LendingPool.
     * @param from The borrower address.
     * @param to The liquidator address.
     * @param amount The amount to transfer.
     */
    function seize(address from, address to, uint256 amount) external onlyOwner {
        _transfer(from, to, amount);
    }
}
