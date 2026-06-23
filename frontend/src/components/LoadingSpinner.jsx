/**
 * Reusable loading spinner with size variants.
 */

import { Loader2 } from 'lucide-react'

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <Loader2
      className={`animate-spin text-brand-600 ${sizes[size]} ${className}`}
      aria-label="Loading"
    />
  )
}
