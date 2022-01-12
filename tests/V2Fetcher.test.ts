import { Token } from "@uniswap/sdk-core";
import { V2Fetcher, V3Fetcher } from "../src";

// Using @ts-ignore to ignore the following error:
// Property '**' is private and only accessible within class 'V2Fetcher'.

const PUBLIC_RPC = "https://polygon-rpc.com/";
const PUBLIC_RPC_MAINNET = "https://cloudflare-eth.com/";
const CHAIN_ID_MAINNET = 1;
const CHAIN_ID_POLYGON = 137;

describe("V2Fetcher", () => {
  describe("getTokens()", () => {
    test("USDC/WETH at quick on polygon", async () => {
      const USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
      const WETH_ADDRESS = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";

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

    test("USDC/ETH at uni on ethereum mainnet", async () => {
      const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
      const ETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

      // https://info.uniswap.org/#/pools/0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8
      const fetcher = new V3Fetcher(
        USDC_ADDRESS,
        ETH_ADDRESS,
        PUBLIC_RPC_MAINNET
      );

      // @ts-ignore
      const tokens = await fetcher.getTokens();

      console.log(tokens);
      expect(tokens).toEqual([
        new Token(CHAIN_ID_MAINNET, USDC_ADDRESS, 6),
        new Token(CHAIN_ID_MAINNET, ETH_ADDRESS, 18),
      ]);
    });
  });
});
