import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ScrollArea({
  children,
  className,
  height,
}: {
  children: ReactNode
  className?: string
  height?: string
}) {
  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={height ? { maxHeight: height } : undefined}
    >
      <div className="h-full w-full overflow-y-auto p-2">{children}</div>
    </div>
  )
}
