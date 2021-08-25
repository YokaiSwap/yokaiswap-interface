import { Web3Provider } from "@ethersproject/providers";
import PolyjuiceHttpProvider from "@polyjuice-provider/web3";

import { polyjuiceConfig } from "../../config";

export const polyjuiceHttpProvider = new PolyjuiceHttpProvider(
  polyjuiceConfig.web3Url!,
  polyjuiceConfig,
);

export const godwokenWeb3Provider = new Web3Provider(polyjuiceHttpProvider);
