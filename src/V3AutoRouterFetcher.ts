import { ethers } from "ethers";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { TEN } from "./constants";
import { IERC20Metadata, IERC20Metadata__factory } from "./contracts";
import { ExchangeV3 } from "./type.d";
import { BigNumber } from "ethers";
import { AlphaRouter } from "@uniswap/smart-order-router";

class V3AutoRouterFetcher {
  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly addresses: [string, string];

  private readonly factoryToken0: IERC20Metadata;

  private readonly factoryToken1: IERC20Metadata;

  private chainId: ethers.providers.Network["chainId"]; // number

  public constructor(
    addressToken0: string,
    addressToken1: string,
    rpcNode: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    this.chainId = 1; // mainnet
  }

  private async getDecimals(): Promise<[number, number]> {
    const [decimalA, decimalB] = await Promise.all([
      this.factoryToken0.decimals(),
      this.factoryToken1.decimals(),
    ]);

    return [decimalA, decimalB];
  }

  private async getTokens(): Promise<[Token, Token]> {
    const [decimalA, decimalB] = await this.getDecimals();

    const network = await this.provider.getNetwork();
    this.chainId = network.chainId;

    const token0 = new Token(this.chainId, this.addresses[0], decimalA);
    const token1 = new Token(this.chainId, this.addresses[1], decimalB);

    return [token0, token1];
  }

  private async getMinAmount(
    tokenA: Token,
    tokenB: Token,
    amount: number = 1
  ): Promise<number> {
    const tokenAInputAmount = CurrencyAmount.fromRawAmount(
      tokenA,
      TEN.pow(tokenA.decimals).mul(amount).toString()
    );

    const router = new AlphaRouter({
      chainId: this.chainId,
      provider: this.provider,
    });
    const route = await router.route(
      tokenAInputAmount,
      tokenB,
      TradeType.EXACT_INPUT
    );

    const out = route?.trade.minimumAmountOut(new Percent(5, 10000));
    const fraction =
      Number(out?.numerator.toString()) / Number(out?.denominator.toString());
    const result =
      BigNumber.from(fraction.toString())
        .div(TEN.pow(tokenB.decimals - 6))
        .toNumber() /
      10 ** 6;

    return result;
  }

  public async fetchExchangeRate(amount: number = 1): Promise<number> {
    const [token0, token1] = await this.getTokens();

    const result = await this.getMinAmount(token0, token1, amount);

    return result;
  }

  public async fetchBidirectionalExchangeRate(
    amount: number = 1
  ): Promise<number[]> {
    const [token0, token1] = await this.getTokens();

    const result = await Promise.all([
      this.getMinAmount(token0, token1, amount),
      this.getMinAmount(token1, token0, amount),
    ]);

    return result;
  }
}

export { V3AutoRouterFetcher };
