const { web3, ethers } = require('hardhat')

const CORRECT_UNLOCKCODE = "test";

class YkoyoteNFT {
    constructor() {}

    _correctUnlockCode() {
        return web3.utils.sha3(CORRECT_UNLOCKCODE);
    }

    //lock it in 3 seconds to test unlock
    async timestampLockedFrom() {

        const blockNumber = await ethers.provider.getBlockNumber()
        const block = await ethers.provider.getBlock(blockNumber)
        const blockTimestamp = block.timestamp
        const osTime = Math.round(Date.now() / 1000) + 3


        return osTime > blockTimestamp ? osTime : blockTimestamp + 3
    }

    //double hashed
    unlockCodeHash() {
        return web3.utils.sha3(this._correctUnlockCode())
    }
}

module.exports = {
    YkoyoteNFT
}