// Shared factory for the Bharat Mechanics icon pack (Material glyphs, 24x24, currentColor).
import * as React from "react"

export type BmIconProps = React.SVGProps<SVGSVGElement> & { size?: number | string }

export function mk(paths: string[], name: string) {
  const C = ({ size = 24, ...rest }: BmIconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" {...rest}>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
  C.displayName = name
  return C
}
