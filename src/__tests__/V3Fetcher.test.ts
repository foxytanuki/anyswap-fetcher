import { Token } from "@uniswap/sdk-core";
import { V3Fetcher } from "..";

// Using @ts-ignore to ignore the following error:
// Property '**' is private and only accessible within class 'V3Fetcher'.

const PUBLIC_RPC_MAINNET = "https://cloudflare-eth.com/";
const PUBLIC_RPC_POLYGON = "https://polygon-rpc.com/";
const CHAIN_ID_MAINNET = 1;
const USDC_ADDRESS_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ETH_ADDRESS_MAINNET = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS_POLYGON = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const JPYC_ADDRESS_POLYGON = "0x6ae7dfc73e0dde2aa99ac063dcf7e8a63265108c";

describe("V3Fetcher", () => {
  describe("private methods", () => {
    describe("getTokens()", () => {
      test("USDC/ETH at uni on ethereum mainnet", async () => {
        // https://info.uniswap.org/#/pools/0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8
        const fetcher = new V3Fetcher(
          USDC_ADDRESS_MAINNET,
          ETH_ADDRESS_MAINNET,
          PUBLIC_RPC_MAINNET
        );

        // @ts-ignore
        const tokens = await fetcher.getTokens();

        expect(tokens).toEqual([
          new Token(CHAIN_ID_MAINNET, USDC_ADDRESS_MAINNET, 6),
          new Token(CHAIN_ID_MAINNET, ETH_ADDRESS_MAINNET, 18),
        ]);
      });
      test("USDC/WETH at uni on polygon mainnet", async () => {
        // https://info.uniswap.org/#/pools/0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8
        const fetcher = new V3Fetcher(
          USDC_ADDRESS_MAINNET,
          ETH_ADDRESS_MAINNET,
          PUBLIC_RPC_MAINNET
        );

        // @ts-ignore
        const tokens = await fetcher.getTokens();

        expect(tokens).toEqual([
          new Token(CHAIN_ID_MAINNET, USDC_ADDRESS_MAINNET, 6),
          new Token(CHAIN_ID_MAINNET, ETH_ADDRESS_MAINNET, 18),
        ]);
      });
    });
  });

  describe("public methods", () => {
    let rate: number;
    let rateInverse: number;

    describe("fetchExchangeRate()", () => {
      const fetcher = new V3Fetcher(
        USDC_ADDRESS_POLYGON,
        JPYC_ADDRESS_POLYGON,
        PUBLIC_RPC_POLYGON
      );
      const fetcherInverse = new V3Fetcher(
        JPYC_ADDRESS_POLYGON,
        USDC_ADDRESS_POLYGON,
        PUBLIC_RPC_POLYGON
      );
      const amount = 100;

      beforeAll(async () => {
        rate = await fetcher.fetchExchangeRate();
        rateInverse = await fetcherInverse.fetchExchangeRate();
      }, 8000);

      test("should fetch USDC/JPYC at QUICK on polygon", async () => {
        expect(rate).toBeGreaterThan(100);
        expect(rate).toBeLessThan(130);
      }, 8000); // 8 seconds

      test("should fetch JPYC/USDC at QUICK on polygon", async () => {
        expect(rateInverse).toBeLessThan(1 / rate);
      }, 8000); // 8 seconds

      test("should fetch the near value of 1 USDC/JPYC with putting 100 USDC", async () => {
        const rateWithAmount = await fetcher.fetchExchangeRate(amount);

        expect(rateWithAmount).toBeLessThanOrEqual(rate);
        // Math.abs(expected - received) < 10 ** 0.5 / 2
        // +- 1.58
        expect(rateWithAmount).toBeCloseTo(rate, -0.5);
      }, 8000); // 8 seconds

      test("should fetch the near value of 1 JPYC/USDC when putting 100 JPYC", async () => {
        const rateWithAmount = await fetcherInverse.fetchExchangeRate(amount);

        expect(rateWithAmount).toBeGreaterThanOrEqual(rateInverse);
        // Math.abs(expected - received) < 10 ** -3 / 2
        // +- 0.0005
        expect(rateWithAmount).toBeCloseTo(rateInverse, 3);
      }, 8000); // 8 seconds
    });

    describe("fetchBidirectionalExchangeRate()", () => {
      let rates: number[];
      const fetcher = new V3Fetcher(
        USDC_ADDRESS_POLYGON,
        JPYC_ADDRESS_POLYGON,
        PUBLIC_RPC_POLYGON
      );
      const fetcherInverse = new V3Fetcher(
        JPYC_ADDRESS_POLYGON,
        USDC_ADDRESS_POLYGON,
        PUBLIC_RPC_POLYGON
      );

      beforeAll(async () => {
        rates = await fetcher.fetchBidirectionalExchangeRate();
      });

      test("should fetch the near value of the result of fetchExchangeRate()", async () => {
        expect(rates[0]).toBeCloseTo(rate);
        expect(rates[1]).toBeCloseTo(rateInverse);
      });

      test("should fetch the near value of the result of fetchExchangeRate() when putting some amounts", async () => {
        const amount = 100;

        const rateWithAmount = await fetcher.fetchExchangeRate(amount);
        const rateInverseWithAmount = await fetcherInverse.fetchExchangeRate(
          amount * rateWithAmount
        );

        const ratesWithAmount = await fetcher.fetchBidirectionalExchangeRate(
          amount
        );

        console.log(ratesWithAmount, rateWithAmount, rateInverseWithAmount);
        expect(ratesWithAmount[0]).toBeCloseTo(rateWithAmount);
        expect(ratesWithAmount[1]).toBeCloseTo(rateInverseWithAmount);
      }, 8000); // 8 seconds
    });
  });
});
