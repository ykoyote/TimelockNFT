const { expect } = require("chai")
const { ethers, network } = require("hardhat")
const { YkoyoteNFT } = require("../lib")

async function deploy() {
  const factory = await ethers.getContractFactory('YkoyoteToken')
  const ykoyoteNFTContract = await factory.deploy()
  
  return { ykoyoteNFTContract }
}


describe("YkoyoteToken test", function () {

  let deployer
  let tokenHolderOne
  let tokenHolderTwo

  before(async () => {
    [deployer, tokenHolderOne, tokenHolderTwo] = await ethers.getSigners()
  })

  it("Should deploy", async function () {
    const factory = await ethers.getContractFactory('YkoyoteToken')
    const ykoyoteNFTContract = await factory.deploy()
    await ykoyoteNFTContract.deployed()
  })

  it("is possible to mint tokens for the minter role", async function () {
    const { ykoyoteNFTContract } = await deploy()
    await ykoyoteNFTContract.deployed()
    const ykoyoteNFT = new YkoyoteNFT()
    // minting works
    await ykoyoteNFTContract.mintToken(tokenHolderOne.address, await ykoyoteNFT.timestampLockedFrom(), ykoyoteNFT.unlockCodeHash())
    
    ////transferring for others doesn't work
    await expect(ykoyoteNFTContract.transferFrom(deployer.address, tokenHolderOne.address, 0))
      .to.be.revertedWith("ERC721: transfer caller is not owner nor approved")

    await expect(ykoyoteNFTContract.connect(tokenHolderOne).transferFrom(tokenHolderOne.address, tokenHolderTwo.address, 0))
      .to.emit(ykoyoteNFTContract, "Transfer")
      .withArgs(tokenHolderOne.address, tokenHolderTwo.address, 0)
  })

  it("is not possible to transfer locked tokens", async function () {
    const { ykoyoteNFTContract } = await deploy()
    await ykoyoteNFTContract.deployed()
    const ykoyoteNFT = new YkoyoteNFT()

    await ykoyoteNFTContract.mintToken(tokenHolderTwo.address, (Math.round(Date.now() / 1000) - 1), ykoyoteNFT.unlockCodeHash())

    ////transferring for others doesn't work
    await expect(ykoyoteNFTContract.connect(tokenHolderTwo).transferFrom(tokenHolderTwo.address, tokenHolderOne.address, 0))
      .to.be.revertedWith("YkoyoteToken: Token locked")
  })

  it("is not possible to unlock tokens for anybody else than the token holder", async function () {
    const { ykoyoteNFTContract } = await deploy()
    await ykoyoteNFTContract.deployed()
    const ykoyoteNFT = new YkoyoteNFT()

    await ykoyoteNFTContract.mintToken(tokenHolderTwo.address, await ykoyoteNFT.timestampLockedFrom(), ykoyoteNFT.unlockCodeHash())

    await expect(ykoyoteNFTContract.unlockToken(ykoyoteNFT.unlockCodeHash(), 0))
    .to.be.revertedWith("YkoyoteToken: Only the Owner can unlock the Token")
  })

  it("is not possible to unlock tokens without the correct unlock code", async function () {
    const { ykoyoteNFTContract } = await deploy()
    await ykoyoteNFTContract.deployed()
    const ykoyoteNFT = new YkoyoteNFT()
    let wrongUnlockCode = web3.utils.sha3('Santa Lucia');
    await ykoyoteNFTContract.mintToken(tokenHolderTwo.address, await ykoyoteNFT.timestampLockedFrom(), ykoyoteNFT.unlockCodeHash())

    await expect(ykoyoteNFTContract.connect(tokenHolderTwo).unlockToken(wrongUnlockCode, 0))
    .to.be.revertedWith("YkoyoteToken: Unlock Code Incorrect")
  })

  it("is possible to unlock the token and transfer it again", async function () {
    const { ykoyoteNFTContract } = await deploy()
    await ykoyoteNFTContract.deployed()
    const ykoyoteNFT = new YkoyoteNFT()

    await ykoyoteNFTContract.mintToken(tokenHolderTwo.address, await ykoyoteNFT.timestampLockedFrom(), ykoyoteNFT.unlockCodeHash())
    await expect(ykoyoteNFTContract.connect(tokenHolderTwo).unlockToken(ykoyoteNFT.unlockCodeHash(), 0))
      .to.emit(ykoyoteNFTContract, "TokenUnlocked")
      .withArgs(0, tokenHolderTwo.address)
  })

});
