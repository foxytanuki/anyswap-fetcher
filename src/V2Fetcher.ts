import { ethers, BigNumber } from "ethers";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { Pair, Trade, Route } from "@uniswap/v2-sdk";
import invariant from "tiny-invariant";
import { TEN } from "./constants";
import {
  IERC20Metadata,
  IERC20Metadata__factory,
  IUniswapV2Factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair__factory,
} from "./contracts";
import { getV2FactoryAddress } from "./utils";
import { ExchangeV2 } from "./type.d";

class V2Fetcher {
  private readonly addresses: [string, string];

  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly factoryToken0: IERC20Metadata;

  private readonly factoryToken1: IERC20Metadata;

  private readonly factoryFactory: IUniswapV2Factory;

  public constructor(
    addressToken0: string,
    addressToken1: string,
    rpcNode: string,
    exchange: ExchangeV2
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
    this.factoryFactory = IUniswapV2Factory__factory.connect(
      getV2FactoryAddress(exchange),
      this.provider
    );
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

    const token0 = new Token(network.chainId, this.addresses[0], decimalA);
    const token1 = new Token(network.chainId, this.addresses[1], decimalB);

    return [token0, token1];
  }

  private async getPairData(token0: Token, token1: Token): Promise<Pair> {
    invariant(token0.chainId === token1.chainId, "CHAIN_ID");

    const pairAddress = await this.factoryFactory.getPair(
      token0.address,
      token1.address
    );

    const pair = IUniswapV2Pair__factory.connect(pairAddress, this.provider);

    const [reserves0, reserves1] = await pair.getReserves();

    const balances = token0.sortsBefore(token1)
      ? [reserves0, reserves1]
      : [reserves1, reserves0];

    return new Pair(
      CurrencyAmount.fromRawAmount(token0, balances[0].toString()),
      CurrencyAmount.fromRawAmount(token1, balances[1].toString())
    );
  }

  private async getRoute(): Promise<Route<Token, Token>> {
    const [token0, token1] = await this.getTokens();

    const pair = await this.getPairData(token0, token1);

    return new Route([pair], token0, token1);
  }

  private async getBothRoutes(): Promise<
    [Route<Token, Token>, Route<Token, Token>]
  > {
    const [token0, token1] = await this.getTokens();

    const pair = await this.getPairData(token0, token1);

    return [
      new Route([pair], token0, token1),
      new Route([pair], token1, token0),
    ];
  }

  private async getMinAmount(
    route: Route<Token, Token>,
    amount: number = 1
  ): Promise<number> {
    const token0 = route.path[0];
    const token1 = route.path[1];

    const token0InputAmount = CurrencyAmount.fromRawAmount(
      token0,
      TEN.pow(token0.decimals).mul(amount).toString()
    );

    const trade = new Trade(route, token0InputAmount, TradeType.EXACT_INPUT);

    const out = trade.minimumAmountOut(new Percent(1, 10000));
    const fraction =
      Number(out.numerator.toString()) / Number(out.denominator.toString());

    const result =
      BigNumber.from(fraction.toString())
        .div(TEN.pow(token1.decimals - 6))
        .toNumber() /
      10 ** 6;

    return result;
  }

  public async fetchEchangeRate(amount: number = 1): Promise<number> {
    const route = await this.getRoute();

    const result = await this.getMinAmount(route, amount);

    return result;
  }

  public async fetchBidirectionalExchangeRate(
    amount: number = 1
  ): Promise<number[]> {
    const routes = await this.getBothRoutes();

    const results = await Promise.all([
      this.getMinAmount(routes[0], amount),
      this.getMinAmount(routes[1], amount),
    ]);

    return results;
  }
}

export { V2Fetcher };
