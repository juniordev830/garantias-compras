// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./WarrantyRegistry.sol";

contract UntrustedCaller {
    function attempt(WarrantyRegistry registry, bytes32 id) external returns (bool) {
        (bool ok,) = address(registry).call(
            abi.encodeCall(WarrantyRegistry.register, (id, address(this), type(uint64).max))
        );
        return ok;
    }
}

contract WarrantyRegistryTest {
    function testRegistrationAndAccess() public {
        WarrantyRegistry registry = new WarrantyRegistry();
        bytes32 id = keccak256("receipt-123");
        registry.register(id, address(this), type(uint64).max);
        require(registry.validFor(id, address(this)), "registered warranty not valid");
        require(!registry.validFor(id, address(1)), "wrong beneficiary accepted");
        require(!new UntrustedCaller().attempt(registry, keccak256("receipt-456")),
            "untrusted registration accepted");
        (bool ok,) = address(registry).call(
            abi.encodeCall(WarrantyRegistry.register, (id, address(this), type(uint64).max))
        );
        require(!ok, "duplicate registration accepted");
    }
}
