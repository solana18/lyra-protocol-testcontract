/* eslint-disable @typescript-eslint/no-unused-vars */
import { createDefaultBoardWithOverrides, mockPrice } from '../utils/seedTestSystem';
import { MONTH_SEC, toBN } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
import { BigNumber, BigNumberish, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { fastForward } from '../utils/evm';
import { seedFixture } from '../utils/fixture';
import { expect, hre } from '../utils/testSetup';
import { OptionType, PositionState, UNIT, getEventArgs } from '../../scripts/util/web3utils';
import { openPositionWithOverrides } from '../utils/contractHelpers';

describe('Integration Test', () => {
  const collaterals = [toBN('0'), toBN('0'), toBN('1'), toBN('1500'), toBN('1500')];

  let oldUserQuoteBal: BigNumber;
  let oldUserBaseBal: BigNumber;
  let oldOMBalance: BigNumber;
  const price = "1";
  const optionType = OptionType.LONG_CALL;

  let staddle: any;

  beforeEach(async () => {
    await seedFixture();
    oldUserQuoteBal = await hre.f.c.snx.quoteAsset.balanceOf(hre.f.deployer.address);
    oldUserBaseBal = await hre.f.c.snx.baseAsset.balanceOf(hre.f.deployer.address);
    oldOMBalance = await hre.f.c.snx.quoteAsset.balanceOf(hre.f.c.optionMarket.address);

    
    staddle = (await ((await ethers.getContractFactory('Straddle')) as ContractFactory).deploy(hre.f.c.optionMarket.address));
  });

  it('opens and settles - base price: ' + price, async () => {
    await createDefaultBoardWithOverrides(hre.f.c, { strikePrices: [price, price, price] });
    await mockPrice(hre.f.c, toBN(price), 'sETH');

    const oldBalance = await hre.f.c.snx.quoteAsset.balanceOf(hre.f.deployer.address);
    const [, positionId] = await openPositionWithOverrides(hre.f.c, {
      optionType: optionType,
      strikeId: 4,
      amount: 1,
      setCollateralTo: collaterals[optionType],
    });

    const newBalance = await hre.f.c.snx.quoteAsset.balanceOf(hre.f.deployer.address);
    expect(oldBalance.sub(newBalance)).to.lt(1000);
    await expectActiveAndAmount(positionId, toBN('1').div(UNIT));
    
    await fastForward(MONTH_SEC);
    await hre.f.c.optionMarket.settleExpiredBoard(2);
    await hre.f.c.shortCollateral.settleOptions([1]);
  });

  it('test buyStraddle - base price: ' + price, async () => {
    await createDefaultBoardWithOverrides(hre.f.c, { strikePrices: [price, price, price] });
    await mockPrice(hre.f.c, toBN(price), 'sETH');


    const oldBalance = await hre.f.c.snx.quoteAsset.balanceOf(hre.f.deployer.address);
    // console.log('oldBalance', oldBalance)
    const _baseBalance = await hre.f.c.snx.baseAsset.balanceOf(hre.f.deployer.address);
    // console.log('_baseBalance', _baseBalance)
    
    const decimals = await hre.f.c.snx.baseAsset.decimals()
    const collateral = ethers.utils.parseUnits("1000", decimals);

    // console.log('collateral', collateral)

    const txApprove = await hre.f.c.snx.baseAsset.approve(staddle.address, collateral);
    await txApprove.wait();
    const tx = await staddle.buyStraddle(hre.f.c.snx.baseAsset.address, 4, 1, 1);
    await tx.wait()

    const newBalance = await hre.f.c.snx.quoteAsset.balanceOf(hre.f.deployer.address);
    expect(oldBalance.sub(newBalance)).to.lt(1000);
  });

});

export async function expectActiveAndAmount(positionId: BigNumberish, amount: BigNumber) {
  const position = await hre.f.c.optionToken.getOptionPosition(positionId);
  expect(position.state).to.eq(PositionState.ACTIVE);
  expect(position.amount).to.eq(amount);
}