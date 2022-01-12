import {
  QUICK_SWAP_V2_FACTORY,
  SUSHI_SWAP_V2_FACTORY,
  UNISWAP_V3_FACTORY,
} from "../constants";
import { ExchangeV2, ExchangeV3 } from "../type.d";

function getV2FactoryAddress(exchange: ExchangeV2) {
  switch (exchange) {
    case "QUICK":
      return QUICK_SWAP_V2_FACTORY;
    case "SUSHI":
      return SUSHI_SWAP_V2_FACTORY;
    default:
      throw new Error(`Unknown exchange: ${exchange}`);
  }
}

function getV3FactoryAddress(exchange: ExchangeV3) {
  switch (exchange) {
    case "UNIV3":
      return UNISWAP_V3_FACTORY;
    default:
      throw new Error(`Unknown exchange: ${exchange}`);
  }
}

export { getV2FactoryAddress, getV3FactoryAddress };
