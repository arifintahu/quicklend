// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IqToken} from "../interfaces/IqToken.sol";

/// @dev Minimal interface to avoid circular imports with ILendingPool.
interface IPoolHealthCheck {
    function checkHealthAfterTransfer(address user) external;
}

/**
 * @title qToken
 * @notice Yield-bearing token representing a user's share in the LendingPool.
 * @dev Controlled by the LendingPool contract (Owner).
 */
contract qToken is ERC20, Ownable, IqToken {
    address public immutable UNDERLYING_ASSET;
    uint8 private _decimals;

    /// @dev Flag to bypass health check during pool-controlled operations (seize).
    bool private _inPoolOperation;

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
        _inPoolOperation = true;
        _transfer(from, to, amount);
        _inPoolOperation = false;
    }

    /**
     * @dev Overrides ERC20._update to enforce a health check on direct user transfers.
     *      Mint (from=0) and burn (to=0) are pool-controlled and skip the check.
     *      Seize operations set _inPoolOperation to also skip the check.
     */
    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);

        // Only check health on user-initiated transfers (not mint, burn, or seize)
        if (from != address(0) && to != address(0) && !_inPoolOperation) {
            IPoolHealthCheck(owner()).checkHealthAfterTransfer(from);
        }
    }
}
