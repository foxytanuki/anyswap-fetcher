import { ethers } from "ethers";

export const SUSHI_SWAP_V2_FACTORY = ethers.utils.getAddress(
  "0xc35DADB65012eC5796536bD9864eD8773aBc74C4"
);

export const QUICK_SWAP_V2_FACTORY = ethers.utils.getAddress(
  "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32"
);

export const UNISWAP_V3_FACTORY = ethers.utils.getAddress(
  "0x1F98431c8aD98523631AE4a59f267346ea31F984"
);

export const UNISWAP_V3_QUOTER = ethers.utils.getAddress(
  "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
);

export const TEN = ethers.BigNumber.from(10);
