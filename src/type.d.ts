import { ethers } from "ethers";

export type ExchangeV2 = "QUICK" | "SUSHI";
export type ExchangeV3 = "UNIV3";
export type Exchange = ExchangeV2 | ExchangeV3;

export interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

export interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}
