// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal on-chain warranty registry prototype (no custody of funds).
contract WarrantyRegistry {
    error NotRegistrar();
    error InvalidWarranty();
    error AlreadyRegistered();

    struct Warranty {
        address beneficiary;
        uint64 expiresAt;
    }

    address public immutable registrar;
    mapping(bytes32 => Warranty) public warranties;

    event Registered(bytes32 indexed id, address indexed beneficiary, uint64 expiresAt);

    constructor() {
        registrar = msg.sender;
    }

    function register(bytes32 id, address beneficiary, uint64 expiresAt) external {
        if (msg.sender != registrar) revert NotRegistrar();
        if (id == bytes32(0) || beneficiary == address(0) || expiresAt <= block.timestamp) {
            revert InvalidWarranty();
        }
        if (warranties[id].beneficiary != address(0)) revert AlreadyRegistered();
        warranties[id] = Warranty(beneficiary, expiresAt);
        emit Registered(id, beneficiary, expiresAt);
    }

    function validFor(bytes32 id, address beneficiary) external view returns (bool) {
        Warranty memory w = warranties[id];
        return w.beneficiary == beneficiary && beneficiary != address(0)
            && block.timestamp < w.expiresAt;
    }
}
