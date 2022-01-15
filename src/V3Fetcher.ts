import { ethers } from "ethers";
import invariant from "tiny-invariant";
import { Token } from "@uniswap/sdk-core";
import { UNISWAP_V3_QUOTER, TEN } from "./constants";
import { Immutables, ExchangeV3 } from "./type.d";
import {
  IERC20Metadata,
  IERC20Metadata__factory,
  IUniswapV3Factory,
  IUniswapV3Factory__factory,
  IUniswapV3Pool,
  IUniswapV3Pool__factory,
  Quoter,
  Quoter__factory,
} from "./contracts";
import { getV3FactoryAddress } from "./utils";

class V3Fetcher {
  private readonly addresses: [string, string];

  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly factoryToken0: IERC20Metadata;

  private readonly factoryToken1: IERC20Metadata;

  private readonly factoryFactory: IUniswapV3Factory;

  private readonly quoter: Quoter;

  public constructor(
    addressToken0: string,
    addressToken1: string,
    rpcNode: string,
    exchange: ExchangeV3 = "UNIV3"
  ) {
    this.addresses = [addressToken0, addressToken1];
    this.provider = new ethers.providers.JsonRpcProvider(rpcNode);
    this.factoryToken0 = IERC20Metadata__factory.connect(
      addressToken0,
      this.provider
    );
    this.factoryToken1 = IERC20Metadata__factory.connect(
      addressToken1,
      this.provider
    );
    this.factoryFactory = IUniswapV3Factory__factory.connect(
      getV3FactoryAddress(exchange),
      this.provider
    );
    this.quoter = Quoter__factory.connect(UNISWAP_V3_QUOTER, this.provider);
  }

  private async getDecimals(): Promise<[number, number]> {
    const [decimalA, decimalB] = await Promise.all([
      this.factoryToken0.decimals(),
      this.factoryToken1.decimals(),
    ]);

    return [decimalA, decimalB];
  }

  private async getTokens(): Promise<[Token, Token]> {
    const [decimal0, decimal1] = await this.getDecimals();

    const network = await this.provider.getNetwork();

    const token0 = new Token(network.chainId, this.addresses[0], decimal0);
    const token1 = new Token(network.chainId, this.addresses[1], decimal1);

    return [token0, token1];
  }

  private async getPoolFactory(): Promise<IUniswapV3Pool> {
    const [token0, token1] = await this.getTokens();
    invariant(token0.chainId === token1.chainId, "CHAIN_ID");

    const feePercentages = [500, 3000, 10000];
    let poolAddress = "";

    for (const feePercentage of feePercentages) {
      const result = await this.factoryFactory.getPool(
        token0.address,
        token1.address,
        feePercentage
      );

      const isEmpty = result === "0x0000000000000000000000000000000000000000";
      if (!isEmpty) {
        poolAddress = result;
        break;
      }
    }

    invariant(poolAddress !== "", "NO POOL");

    const pool = IUniswapV3Pool__factory.connect(poolAddress, this.provider);
    return pool;
  }

  private async getPoolImmutables(
    poolContract: IUniswapV3Pool
  ): Promise<Immutables> {
    const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
      await Promise.all([
        poolContract.factory(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.maxLiquidityPerTick(),
      ]);

    const immutables: Immutables = {
      factory,
      token0,
      token1,
      fee,
      tickSpacing,
      maxLiquidityPerTick,
    };
    return immutables;
  }

  private async getQuatedAmount(
    isInputToken0: Boolean,
    fee: number,
    amount: number = 1
  ): Promise<number> {
    const [decimal0, decimal1] = await this.getDecimals();
    const InputAmount = TEN.pow(isInputToken0 ? decimal0 : decimal1)
      .mul(amount)
      .toString();

    const quotedAmountOut = await this.quoter.callStatic.quoteExactInputSingle(
      this.addresses[isInputToken0 ? 0 : 1],
      this.addresses[isInputToken0 ? 1 : 0],
      fee,
      InputAmount.toString(),
      0
    );

    const result =
      quotedAmountOut
        .div(TEN.pow((isInputToken0 ? decimal1 : decimal0) - 6))
        .div(amount)
        .toNumber() /
      10 ** 6;

    return result;
  }

  public async fetchExchangeRate(amount: number = 1): Promise<number> {
    const poolFactory = await this.getPoolFactory();
    const immutables = await this.getPoolImmutables(poolFactory);

    const result = await this.getQuatedAmount(
      true,
      immutables.fee,
      Math.round(amount)
    );

    return result;
  }

  public async fetchBidirectionalExchangeRate(
    amount: number = 1
  ): Promise<number[]> {
    const poolFactory = await this.getPoolFactory();
    const immutables = await this.getPoolImmutables(poolFactory);

    const result0 = await this.getQuatedAmount(
      true,
      immutables.fee,
      Math.round(amount)
    );
    const result1 = await this.getQuatedAmount(
      false,
      immutables.fee,
      Math.round(amount * result0)
    );

    return [result0, result1];
  }
}

export { V3Fetcher };
