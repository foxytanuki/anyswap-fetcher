import { Token } from "@uniswap/sdk-core";
import { V3Fetcher } from "..";

// Using @ts-ignore to ignore the following error:
// Property '**' is private and only accessible within class 'V3Fetcher'.

const PUBLIC_RPC_MAINNET = "https://cloudflare-eth.com/";
const CHAIN_ID_MAINNET = 1;

describe("V3Fetcher", () => {
  describe("getTokens()", () => {
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
