// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IqToken} from "../interfaces/IqToken.sol";

/**
 * @title qToken
 * @notice Yield-bearing token representing a user's share in the LendingPool.
 * @dev Controlled by the LendingPool contract (Owner).
 */
contract qToken is ERC20, Ownable, IqToken {
    address public immutable UNDERLYING_ASSET;
    uint8 private _decimals;

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
        try IERC20Metadata(_underlyingAsset).decimals() returns (uint8 d) {
            _decimals = d;
        } catch {
            _decimals = 18; // Default to 18 if call fails
        }
    }

    function decimals() public view virtual override(ERC20, IERC20Metadata) returns (uint8) {
        return _decimals;
    }

    /**
     * @inheritdoc IqToken
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @inheritdoc IqToken
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @inheritdoc IqToken
     */
    function seize(address from, address to, uint256 amount) external onlyOwner {
        _transfer(from, to, amount);
    }
}
