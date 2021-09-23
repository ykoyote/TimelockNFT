// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract YkoyoteToken is ERC721PresetMinterPauserAutoId {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping (uint => uint) public tokenLockedFromTimestamp;
    mapping (uint => bytes32) public tokenUnlockCodeHashes;
    mapping (uint => bool) public tokenUnlocked;

    event TokenUnlocked(uint tokenId, address unlockerAddress);

    constructor() ERC721PresetMinterPauserAutoId("YkoyoteToken", "YYT", "https://ykoyote.art/metadata/") {}

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {
        console.log("tokenLockedFromTimestamp[tokenId]:", tokenLockedFromTimestamp[tokenId]);
        console.log("block.timestamp:", block.timestamp);
        console.log("tokenUnlocked[tokenId]:", tokenUnlocked[tokenId]);
        console.log("tokenId:", tokenId);
        require(tokenLockedFromTimestamp[tokenId] > block.timestamp || tokenUnlocked[tokenId], "YkoyoteToken: Token locked");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function unlockToken(bytes32 unlockHash, uint256 tokenId) public {
        require(msg.sender == ownerOf(tokenId), "YkoyoteToken: Only the Owner can unlock the Token"); //not 100% sure about that one yet
        require(keccak256(abi.encode(unlockHash)) == tokenUnlockCodeHashes[tokenId], "YkoyoteToken: Unlock Code Incorrect");
        tokenUnlocked[tokenId] = true;
        emit TokenUnlocked(tokenId, msg.sender);
    }

    /**
    * This one is the mint function that sets the unlock code, then calls the parent mint
    */
    function mintToken(address to, uint lockedFromTimestamp, bytes32 unlockHash) public {
        tokenLockedFromTimestamp[_tokenIds.current()] = lockedFromTimestamp;
        tokenUnlockCodeHashes[_tokenIds.current()] = unlockHash;
        _tokenIds.increment();
        super.mint(to);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    return string(abi.encodePacked(super.tokenURI(tokenId),".json"));
    }
}