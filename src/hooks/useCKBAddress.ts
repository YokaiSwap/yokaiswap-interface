import { useMemo } from "react";

import { usePWAddress } from "./usePWAddress";

export function useCKBAddress(ethAddr?: string | null) {
  const pwAddress = usePWAddress(ethAddr);
  return useMemo(() => pwAddress?.toCKBAddress(), [pwAddress]);
}
