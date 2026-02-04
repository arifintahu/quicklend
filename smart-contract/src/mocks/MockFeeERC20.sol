// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev ERC20 that burns a 2% fee on every non-mint/burn transfer.
contract MockFeeERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            // 2% fee is burned
            uint256 fee = value / 50;
            super._update(from, to, value - fee);
            if (fee > 0) {
                super._update(from, address(0), fee); // burn fee
            }
        } else {
            super._update(from, to, value);
        }
    }
}
