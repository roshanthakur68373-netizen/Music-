/// <reference types="vite/client" />

declare module 'lucide-react' {
  import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react'

  export interface LucideIconProps extends SVGProps<SVGSVGElement> {
    size?: number
    color?: string
    strokeWidth?: number | string
    absoluteStrokeWidth?: boolean
  }

  export type LucideIcon = ForwardRefExoticComponent<LucideIconProps & RefAttributes<SVGSVGElement>>

  export const Play: LucideIcon
  export const Pause: LucideIcon
  export const SkipNext: LucideIcon
  export const SkipPrevious: LucideIcon
  export const Volume2: LucideIcon
  export const VolumeX: LucideIcon
  export const Search: LucideIcon
  export const Heart: LucideIcon
  export const ListMusic: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronUp: LucideIcon
  export const Shuffle: LucideIcon
  export const Repeat: LucideIcon
  export const Mic: LucideIcon
  export const Settings: LucideIcon
  export const Menu: LucideIcon
  export const X: LucideIcon
  export const Plus: LucideIcon
  export const Minus: LucideIcon
  export const ChevronLeft: LucideIcon
}