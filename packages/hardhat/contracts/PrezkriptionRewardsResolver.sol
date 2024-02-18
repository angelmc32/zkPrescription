// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";

import { SchemaResolver } from "./SchemaResolver.sol";

import { IEAS, Attestation } from "./interfaces/IEAS.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PrezkriptionRewardsResolver
/// @notice A schema resolver that pays attesters for generated prezkriptions,
/// @notice as well as fulfilled prescriptions (per revoking attestation)
contract PrezkriptionRewardsResolver is SchemaResolver, Ownable {
	using Address for address payable;

	error InvalidValue();

	uint256 public incentive;

	constructor(
		IEAS eas_,
		uint256 incentive_,
		address owner_
	) SchemaResolver(eas_) {
		incentive = incentive_;
		transferOwnership(owner_);
	}

	function updateIncentive(uint256 newIncentive) external onlyOwner {
		incentive = newIncentive;
	}

	function withdraw() external onlyOwner {
		uint256 balance = address(this).balance;
		require(balance > 0, "No funds to withdraw");
		payable(owner()).transfer(balance);
	}

	function isPayable() public pure override returns (bool) {
		return true;
	}

	function onAttest(
		Attestation calldata attestation,
		uint256 value
	) internal override returns (bool) {
		if (value > 0) {
			return false;
		}

		payable(attestation.attester).transfer(incentive);

		return true;
	}

	function onRevoke(
		Attestation calldata attestation,
		uint256 value
	) internal override returns (bool) {
		if (value > incentive) {
			return false;
		}
		payable(attestation.attester).transfer(incentive);

		return true;
	}
}
