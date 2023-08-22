//SPDX-License-Identifier: ISC
pragma solidity 0.8.16;
import "openzeppelin-contracts-4.4.1/security/ReentrancyGuard.sol";
import "openzeppelin-contracts-4.4.1/token/ERC20/IERC20.sol";
import "../OptionMarket.sol";

/**
 * @title Straddle
 * @author @0xAxie
 * @dev contract for atomic transaction.
 */
contract Straddle is ReentrancyGuard {

  OptionMarket private market;



  constructor(OptionMarket _market) {
    market = _market;
  }

  function buyStraddle(address quoteAsset, uint _strikeId, uint _amount, uint _collateral) external nonReentrant {
    IERC20(quoteAsset).transferFrom(msg.sender, address(this), uint(_collateral));

    OptionMarket.TradeInputParameters memory paramsCall = OptionMarket.TradeInputParameters({
      strikeId: _strikeId,
      positionId: 0,
      amount: _amount,
      setCollateralTo: _collateral,
      iterations: 1,
      minTotalCost: 0,
      maxTotalCost: type(uint128).max,
      optionType: OptionMarket.OptionType.LONG_CALL,
      referrer: address(0)
    });
    market.openPosition(paramsCall);

    OptionMarket.TradeInputParameters memory paramsPut = OptionMarket.TradeInputParameters({
      strikeId: _strikeId,
      positionId: 0,
      amount: _amount,
      setCollateralTo: _collateral,
      iterations: 1,
      minTotalCost: 0,
      maxTotalCost: type(uint128).max,
      optionType: OptionMarket.OptionType.LONG_PUT,
      referrer: address(0)
    });
    market.openPosition(paramsPut);
    

  }
}
