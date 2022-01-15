import { Token } from "@uniswap/sdk-core";
import { V2Fetcher } from "..";

// Using @ts-ignore to ignore the following error:
// Property '**' is private and only accessible within class 'V2Fetcher'.

const PUBLIC_RPC = "https://polygon-rpc.com/";
const CHAIN_ID_POLYGON = 137;
const USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const WETH_ADDRESS = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";
const JPYC_ADDRESS = "0x6ae7dfc73e0dde2aa99ac063dcf7e8a63265108c";

describe("V2Fetcher", () => {
  describe("private methods", () => {
    describe("getTokens()", () => {
      test("USDC/WETH at quick on polygon", async () => {
        // info.quickswap.exchange/#/pair/0x853ee4b2a13f8a742d64c8f088be7ba2131f670d
        const fetcher = new V2Fetcher(
          USDC_ADDRESS,
          WETH_ADDRESS,
          PUBLIC_RPC,
          "QUICK"
        );

        // @ts-ignore
        const tokens = await fetcher.getTokens();

        expect(tokens).toEqual([
          new Token(CHAIN_ID_POLYGON, USDC_ADDRESS, 6),
          new Token(CHAIN_ID_POLYGON, WETH_ADDRESS, 18),
        ]);
      });
    });
  });

  describe("public methods", () => {
    let rate: number;
    let rateInverse: number;

    describe("fetchExchangeRate()", () => {
      const fetcher = new V2Fetcher(
        USDC_ADDRESS,
        JPYC_ADDRESS,
        PUBLIC_RPC,
        "QUICK"
      );
      const fetcherInverse = new V2Fetcher(
        JPYC_ADDRESS,
        USDC_ADDRESS,
        PUBLIC_RPC,
        "QUICK"
      );
      const amount = 100;

      beforeAll(async () => {
        rate = await fetcher.fetchExchangeRate();
        rateInverse = await fetcherInverse.fetchExchangeRate();
      });

      test("should fetch USDC/JPYC at QUICK on polygon", async () => {
        expect(rate).toBeGreaterThan(100);
        expect(rate).toBeLessThan(130);
      });

      test("should fetch JPYC/USDC at QUICK on polygon", async () => {
        expect(rateInverse).toBeLessThan(1 / rate);
      });

      test("should fetch the near value of 1 USDC/JPYC with putting 100 USDC", async () => {
        const rateWithAmount = await fetcher.fetchExchangeRate(amount);

        expect(rateWithAmount).toBeLessThanOrEqual(rate);
        // Math.abs(expected - received) < 10 ** 0.5 / 2
        // +- 1.58
        expect(rateWithAmount).toBeCloseTo(rate, -0.5);
      });

      test("should fetch the near value of 1 JPYC/USDC when putting 100 JPYC", async () => {
        const rateWithAmount = await fetcherInverse.fetchExchangeRate(amount);

        expect(rateWithAmount).toBeGreaterThanOrEqual(rateInverse);
        // Math.abs(expected - received) < 10 ** -3 / 2
        // +- 0.0005
        expect(rateWithAmount).toBeCloseTo(rateInverse, 3);
      });
    });

    describe("fetchBidirectionalExchangeRate()", () => {
      let rates: number[];
      const fetcher = new V2Fetcher(
        USDC_ADDRESS,
        JPYC_ADDRESS,
        PUBLIC_RPC,
        "QUICK"
      );
      const fetcherInverse = new V2Fetcher(
        JPYC_ADDRESS,
        USDC_ADDRESS,
        PUBLIC_RPC,
        "QUICK"
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

        expect(ratesWithAmount[0]).toBeCloseTo(rateWithAmount);
        expect(ratesWithAmount[1]).toBeCloseTo(rateInverseWithAmount);
      });
    });
  });
});
