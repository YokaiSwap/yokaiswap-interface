import { useContext, useMemo } from "react";
import { Address, AddressType } from "@lay2/pw-core";

import { GodwokenBaseContext } from "../contexts/Godwoken/contexts";

export function usePWAddress(ethAddr?: string | null): Address | undefined {
  const { pwCore } = useContext(GodwokenBaseContext);

  return useMemo(
    () =>
      ethAddr != null && pwCore != null
        ? new Address(ethAddr, AddressType.eth)
        : undefined,
    [ethAddr, pwCore],
  );
}
