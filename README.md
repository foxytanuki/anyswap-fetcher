# Anyswap Fetcher

The tool you can get a exchange rate of tokenA and tokenB just by putting their token addresses.

## Install
```shell
yarn add anyswap-fetcher
```
or
```shell
npm i anyswap-fetcher
```
## Exchange 
- Uniswap V3
  - `UNIV3`
- Sushiswap
  - `SUSHI`
- Quickswap
  - `QUICK`

I only checked this library works fine on the test case in `tests` directory but I believe other combinations works well. (e.g. Uniswap on Polygon)

## Usage 
### fetchExchangeRate

```typescript
fetchExchangeRate(token0: string, token1: string, rpc: string, exchange: Exchange, amount: number = 1)
```

You can fetch the exchange rate of given tokens.

inputToken: `token0`
ourputToken: `token1`


### fetchBidirectionalExchangeRate

```typescript
fetchBidirectionalExchangeRate(token0: string, token1: string, rpc: string, exchange: Exchange, amount: number = 1 )
```
You can fetch the exchange rate of given tokens in bidirectional.


## Examples
### Fetch Exchange Price from V2Pool in Bidirectional

```typescript
import { V2Fetcher } from "anyswap-fetcher";

const USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

const JPYC_ADDRESS = "0x6ae7dfc73e0dde2aa99ac063dcf7e8a63265108c";

const RPC_NODE_POLYGON = "https://polygon-rpc.com/";

async function main() {
  const quick = new V2Fetcher(
    USDC_ADDRESS,
    JPYC_ADDRESS,
    RPC_NODE_POLYGON,
    "QUICK" // exchange
  ).fetchBidirectionalExchangeRate();

  console.log(await quick);
}

main();
```
### Fetch Exchange Price from V3Pool in Bidirectional

```javascript
import { ethers } from "ethers";
import { V3Fetcher } from "anyswap-fetcher";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const RPC_NODE_MAINNET = "https://cloudflare-eth.com/";

async function main() {
  const quick = new V3Fetcher(
    USDC_ADDRESS,
    ETH_ADDRESS,
    RPC_NODE_MAINNET,
    // Don't have to write exchange since Uniswap is the only exchange which have V3 contracts for now.
  ).fetchBidirectionalExchangeRate();

  console.log(await quick);
}

main();
```

### Fetch Exchange Price from V3AlphaAutoRouter in Bidirectional

```javascript
import { ethers } from "ethers";
import { V3AutoRouterFetcher } from "anyswap-fetcher";

const USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const JPYC_ADDRESS = "0x6ae7dfc73e0dde2aa99ac063dcf7e8a63265108c";

const RPC_NODE_POLYGON = "https://polygon-rpc.com/";

async function main() {
  const uniAuto = new V3AutoRouterFetcher(
    USDC_ADDRESS,
    JPYC_ADDRESS,
    RPC_NODE_POLYGON,
    "UNIV3"
  ).fetchBidirectionalExchangeRate();

  console.log(await quick); // Output: [ 114.288142, 0.008731 ]
}

main();
```

