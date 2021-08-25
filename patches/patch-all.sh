#!/bin/bash

patch --forward node_modules/@polyjuice-provider/web3/lib/providers.js patches/@polyjuice-provider/web3/lib/providers.js.patch
rm -f node_modules/@polyjuice-provider/web3/lib/providers.js.rej

patch --forward node_modules/@ckb-lumos/base/lib/utils.js patches/@ckb-lumos/base/lib/utils.js.patch
rm -f node_modules/@ckb-lumos/base/lib/utils.js.rej

patch --forward node_modules/@lay2/pw-core/build/module/providers/eth-provider.js patches/@lay2/pw-core/build/module/providers/eth-provider.js.patch
rm -f node_modules/@lay2/pw-core/build/module/providers/eth-provider.js.rej

patch --forward node_modules/@lay2/pw-core/build/module/signers/eth-signer.js patches/@lay2/pw-core/build/module/signers/eth-signer.js.patch
rm -f node_modules/@lay2/pw-core/build/module/signers/eth-signer.js.rej

patch --forward node_modules/@lay2/pw-core/build/module/signers/signer.js patches/@lay2/pw-core/build/module/signers/signer.js.patch
rm -f node_modules/@lay2/pw-core/build/module/signers/signer.js.rej

patch --forward node_modules/@lay2/pw-core/build/main/collectors/collector.d.ts patches/@lay2/pw-core/build/main/collectors/collector.d.ts.patch
rm -f node_modules/@lay2/pw-core/build/main/collectors/collector.d.ts.rej

patch --forward node_modules/jsbi/jsbi.d.ts patches/jsbi/jsbi.d.ts.patch
rm -f node_modules/jsbi/jsbi.d.ts.rej
