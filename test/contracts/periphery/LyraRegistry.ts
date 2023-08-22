import { ContractFactory } from 'ethers/lib/ethers';
import { ethers } from 'hardhat';
import { toBytes32, ZERO_ADDRESS } from '../../../scripts/util/web3utils';
import { LiquidityPool, OptionMarket } from '../../../typechain-types';
import { deployFixture } from '../../utils/fixture';
import { expect, hre } from '../../utils/testSetup';

describe('LyraRegistry tests', () => {
  beforeEach(deployFixture);

  describe('LyraRegistry', () => {
    it('can register global contracts', async () => {
      await hre.f.c.lyraRegistry.updateGlobalAddresses(
        [toBytes32('SYNTHETIX_ADAPTER')],
        [hre.f.c.synthetixAdapter.address],
      );
      // can only be called by owner
      await expect(
        hre.f.c.lyraRegistry
          .connect(hre.f.alice)
          .updateGlobalAddresses([toBytes32('SYNTHETIX_ADAPTER')], [hre.f.c.optionMarket.address]),
      ).revertedWith('OnlyOwner');
      expect(await hre.f.c.lyraRegistry.globalAddresses(toBytes32('SYNTHETIX_ADAPTER'))).eq(
        hre.f.c.synthetixAdapter.address,
      );
    });

    it('update global contracts wrong', async () => {
      await expect(
        hre.f.c.lyraRegistry.updateGlobalAddresses(
          [toBytes32('SYNTHETIX_ADAPTER'), toBytes32('SYNTHETIX_ADAPTER')],
          [hre.f.c.synthetixAdapter.address],
        ),
      ).to.be.revertedWith('length mismatch');
    });

    it('reverts if global name wrong', async () => {
      await expect(hre.f.c.lyraRegistry.getGlobalAddress(toBytes32('SNX_ADAPTER'))).to.be.revertedWith(
        'NonExistentGlobalContract',
      );
    });

    it('can add and remove an option market', async () => {
      await hre.f.c.lyraRegistry.addMarket({
        greekCache: hre.f.c.optionGreekCache.address,
        liquidityPool: hre.f.c.liquidityPool.address,
        liquidityToken: hre.f.c.liquidityToken.address,
        optionMarket: hre.f.c.optionMarket.address,
        optionMarketPricer: hre.f.c.optionMarketPricer.address,
        optionToken: hre.f.c.optionToken.address,
        poolHedger: hre.f.c.poolHedger.address,
        shortCollateral: hre.f.c.shortCollateral.address,
        gwavOracle: hre.f.c.GWAVOracle.address,
        baseAsset: hre.f.c.snx.baseAsset.address,
        quoteAsset: hre.f.c.snx.quoteAsset.address,
      });

      const addresses = await hre.f.c.lyraRegistry.getMarketAddresses(hre.f.c.optionMarket.address);
      expect(addresses.greekCache).eq(hre.f.c.optionGreekCache.address);
      expect(addresses.liquidityPool).eq(hre.f.c.liquidityPool.address);
      expect(addresses.liquidityToken).eq(hre.f.c.liquidityToken.address);
      expect(addresses.optionMarket).eq(hre.f.c.optionMarket.address);
      expect(addresses.optionMarketPricer).eq(hre.f.c.optionMarketPricer.address);
      expect(addresses.optionToken).eq(hre.f.c.optionToken.address);
      expect(addresses.poolHedger).eq(hre.f.c.poolHedger.address);
      expect(addresses.shortCollateral).eq(hre.f.c.shortCollateral.address);
      expect(addresses.gwavOracle).eq(hre.f.c.GWAVOracle.address);
      expect(addresses.baseAsset).eq(hre.f.c.snx.baseAsset.address);
      expect(addresses.quoteAsset).eq(hre.f.c.snx.quoteAsset.address);

      await expect(hre.f.c.lyraRegistry.removeMarket(ZERO_ADDRESS)).revertedWith('RemovingInvalidMarket');

      await hre.f.c.lyraRegistry.removeMarket(hre.f.c.optionMarket.address);
      await expect(hre.f.c.lyraRegistry.getMarketAddresses(hre.f.c.optionMarket.address)).to.revertedWith(
        'NonExistentMarket',
      );
    });

    it('revert for invalid market', async () => {
      await hre.f.c.lyraRegistry.removeMarket(hre.f.c.optionMarket.address);
      await expect(hre.f.c.lyraRegistry.removeMarket(hre.f.c.optionMarket.address)).to.be.revertedWith(
        'RemovingInvalidMarket',
      );
    });

    it('able to add another market', async () => {
      const optionMarket2 = (await ((await ethers.getContractFactory('OptionMarket')) as ContractFactory)
        .connect(hre.f.deployer)
        .deploy()) as OptionMarket;

      await hre.f.c.lyraRegistry.addMarket({
        greekCache: hre.f.c.optionGreekCache.address,
        liquidityPool: hre.f.c.liquidityPool.address,
        liquidityToken: hre.f.c.liquidityToken.address,
        optionMarket: optionMarket2.address,
        optionMarketPricer: hre.f.c.optionMarketPricer.address,
        optionToken: hre.f.c.optionToken.address,
        poolHedger: hre.f.c.poolHedger.address,
        shortCollateral: hre.f.c.shortCollateral.address,
        gwavOracle: hre.f.c.GWAVOracle.address,
        baseAsset: hre.f.c.snx.baseAsset.address,
        quoteAsset: hre.f.c.snx.quoteAsset.address,
      });

      const addresses = await hre.f.c.lyraRegistry.marketAddresses(optionMarket2.address);
      expect(addresses.optionMarket).eq(optionMarket2.address);
    });
    it('update only LP market address', async () => {
      await hre.f.c.lyraRegistry.addMarket({
        greekCache: hre.f.c.optionGreekCache.address,
        liquidityPool: hre.f.c.liquidityPool.address,
        liquidityToken: hre.f.c.liquidityToken.address,
        optionMarket: hre.f.c.optionMarket.address,
        optionMarketPricer: hre.f.c.optionMarketPricer.address,
        optionToken: hre.f.c.optionToken.address,
        poolHedger: hre.f.c.poolHedger.address,
        shortCollateral: hre.f.c.shortCollateral.address,
        gwavOracle: hre.f.c.GWAVOracle.address,
        baseAsset: hre.f.c.snx.baseAsset.address,
        quoteAsset: hre.f.c.snx.quoteAsset.address,
      });

      let addresses = await hre.f.c.lyraRegistry.marketAddresses(hre.f.c.optionMarket.address);
      expect(addresses.liquidityPool).eq(hre.f.c.liquidityPool.address);

      // Just change the LP address in lyra registry
      const lp2 = (await ((await ethers.getContractFactory('LiquidityPool')) as ContractFactory)
        .connect(hre.f.deployer)
        .deploy()) as LiquidityPool;

      await hre.f.c.lyraRegistry.addMarket({
        greekCache: hre.f.c.optionGreekCache.address,
        liquidityPool: lp2.address,
        liquidityToken: hre.f.c.liquidityToken.address,
        optionMarket: hre.f.c.optionMarket.address,
        optionMarketPricer: hre.f.c.optionMarketPricer.address,
        optionToken: hre.f.c.optionToken.address,
        poolHedger: hre.f.c.poolHedger.address,
        shortCollateral: hre.f.c.shortCollateral.address,
        gwavOracle: hre.f.c.GWAVOracle.address,
        baseAsset: hre.f.c.snx.baseAsset.address,
        quoteAsset: hre.f.c.snx.quoteAsset.address,
      });

      addresses = await hre.f.c.lyraRegistry.marketAddresses(hre.f.c.optionMarket.address);
      expect(addresses.liquidityPool).eq(lp2.address);
    });
  });
});
