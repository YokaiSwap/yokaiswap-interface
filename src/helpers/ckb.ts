import { RPC as CKBRPC } from "ckb-js-toolkit";
import {
  CkbIndexer,
  IndexerCollector as CKBIndexerCollector,
} from "@lay2/pw-core";

import { ckbRPCURL, ckbIndexerURL } from "../config";

export const ckbRPC = new CKBRPC(ckbRPCURL);

export const ckbCollector = new CKBIndexerCollector(ckbIndexerURL);

export const ckbIndexer = new CkbIndexer(ckbIndexerURL);

export const emptyScriptHash =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
