import React from 'react'
import { useRefresh } from 'hooks/useRefresh'
import { HelpCircle } from 'react-feather'

const badSrcs: { [url: string]: true } = {}

export interface LogoProps {
  alt?: string
  style?: any
  className?: string
  srcs: string[]
}

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, ...rest }: LogoProps) {
  const refresh = useRefresh()

  const src: string | undefined = srcs.find((s) => !badSrcs[s])

  if (src) {
    return (
      <img
        {...rest}
        alt={alt}
        src={src}
        onError={() => {
          if (src) {
            badSrcs[src] = true
          }
          refresh()
        }}
      />
    )
  }

  return <HelpCircle color="white" {...rest} />
}
