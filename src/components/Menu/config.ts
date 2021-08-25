import { MenuEntry } from '@yokaiswap/interface-uikit'

const config: MenuEntry[] = [
  {
    label: 'Home',
    icon: 'HomeIcon',
    href: 'https://dev.yokaiswap.com/',
  },
  {
    label: 'Trade',
    icon: 'TradeIcon',
    initialOpenState: true,
    items: [
      {
        label: 'Exchange',
        href: '/swap',
      },
      {
        label: 'Liquidity',
        href: '/liquidity',
      },
    ],
  },
  {
    label: 'Asset Bridge',
    icon: 'BridgeIcon',
    initialOpenState: false,
    items: [
      {
        label: 'Deposit',
        href: '/bridge/deposit',
      },
      {
        label: 'Withdrawal',
        href: '/bridge/withdrawal',
      },
      {
        label: 'Transfer',
        href: '/bridge/transfer',
      },
    ],
  },
  {
    label: 'Farms',
    icon: 'FarmIcon',
    href: 'https://dev.yokaiswap.com/farms',
  },
  {
    label: 'Pools',
    icon: 'PoolIcon',
    href: 'https://dev.yokaiswap.com/pools',
  },
]

export default config
